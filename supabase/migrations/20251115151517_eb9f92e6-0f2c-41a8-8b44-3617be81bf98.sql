-- Create spotlight_images table
CREATE TABLE IF NOT EXISTS public.spotlight_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_id UUID REFERENCES public.artist_stories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_source TEXT NOT NULL CHECK (image_source IN ('ai', 'discogs', 'upload')),
  title TEXT,
  context TEXT,
  insertion_point TEXT,
  discogs_release_id INTEGER,
  display_order INTEGER DEFAULT 0,
  is_inserted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotlight_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view spotlight images"
ON public.spotlight_images FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert spotlight images"
ON public.spotlight_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update spotlight images"
ON public.spotlight_images FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete spotlight images"
ON public.spotlight_images FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create storage bucket for spotlight uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('spotlight-uploads', 'spotlight-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload spotlight images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'spotlight-uploads');

CREATE POLICY "Anyone can view spotlight images"
ON storage.objects FOR SELECT
USING (bucket_id = 'spotlight-uploads');

CREATE POLICY "Authenticated users can delete their spotlight uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'spotlight-uploads');