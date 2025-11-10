-- Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('royalty', 'user', 'ai')) DEFAULT 'user',
  original_url text NOT NULL,
  display_url text NOT NULL,
  width int,
  height int,
  artist text,
  album text,
  venue text,
  city text,
  country text,
  event_date date,
  year int,
  format text CHECK (format IN ('concert', 'vinyl', 'cd', 'cassette', 'poster', 'other')) DEFAULT 'concert',
  caption text,
  tags text[] DEFAULT '{}',
  license_granted boolean DEFAULT false,
  print_allowed boolean DEFAULT true,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'flagged', 'removed')) DEFAULT 'draft',
  seo_slug text UNIQUE,
  seo_title text,
  seo_description text,
  canonical_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  like_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  flagged_count int DEFAULT 0
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('visible', 'hidden', 'removed')) DEFAULT 'visible'
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photos_status_published ON public.photos(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON public.photos USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_photos_artist_year ON public.photos(artist, year);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo ON public.photo_comments(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON public.photo_likes(photo_id);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY "Public can view published photos"
  ON public.photos FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());

CREATE POLICY "Users can create their own photos"
  ON public.photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON public.photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON public.photos FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Public can view visible comments"
  ON public.photo_comments FOR SELECT
  USING (status = 'visible');

CREATE POLICY "Authenticated users can create comments"
  ON public.photo_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.photo_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.photo_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Public can view all likes"
  ON public.photo_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON public.photo_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.photo_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fanwall-photos', 'fanwall-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fanwall-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fanwall-photos' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fanwall-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fanwall-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update like count
CREATE OR REPLACE FUNCTION update_photo_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photos 
    SET like_count = like_count + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photos 
    SET like_count = like_count - 1 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_photo_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photos 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photos 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers
CREATE TRIGGER trigger_update_photo_like_count
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION update_photo_like_count();

CREATE TRIGGER trigger_update_photo_comment_count
  AFTER INSERT OR DELETE ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION update_photo_comment_count();