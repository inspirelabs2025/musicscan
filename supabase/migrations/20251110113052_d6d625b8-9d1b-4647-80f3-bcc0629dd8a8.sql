-- Create artist_fanwalls table
CREATE TABLE IF NOT EXISTS public.artist_fanwalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  photo_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  featured_photo_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_fanwalls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Artist fanwalls are viewable by everyone"
  ON public.artist_fanwalls
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create artist fanwalls"
  ON public.artist_fanwalls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update artist fanwalls"
  ON public.artist_fanwalls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Index for faster lookups
CREATE INDEX idx_artist_fanwalls_slug ON public.artist_fanwalls(slug);
CREATE INDEX idx_artist_fanwalls_artist_name ON public.artist_fanwalls(artist_name);
CREATE INDEX idx_artist_fanwalls_photo_count ON public.artist_fanwalls(photo_count DESC);

-- Function to generate artist slug
CREATE OR REPLACE FUNCTION public.generate_artist_slug(artist_name_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from artist name
  base_slug := lower(regexp_replace(trim(artist_name_input), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'artist';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS(SELECT 1 FROM public.artist_fanwalls WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to find or create artist fanwall
CREATE OR REPLACE FUNCTION public.find_or_create_artist_fanwall(artist_name_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_id UUID;
  artist_slug TEXT;
BEGIN
  -- Try to find existing artist
  SELECT id INTO artist_id
  FROM public.artist_fanwalls
  WHERE LOWER(artist_name) = LOWER(artist_name_input);
  
  -- If not found, create new artist fanwall
  IF artist_id IS NULL THEN
    artist_slug := public.generate_artist_slug(artist_name_input);
    
    INSERT INTO public.artist_fanwalls (
      artist_name,
      slug,
      seo_title,
      seo_description,
      canonical_url
    ) VALUES (
      artist_name_input,
      artist_slug,
      artist_name_input || ' FanWall - Fan Photos & Memories | MusicScan',
      'Ontdek ' || artist_name_input || ' fan foto''s: live concerten, vinyl collecties, en meer. Deel jouw ' || artist_name_input || ' herinneringen!',
      'https://www.musicscan.app/fanwall/' || artist_slug
    )
    RETURNING id INTO artist_id;
  END IF;
  
  RETURN artist_id;
END;
$$;

-- Trigger to update artist_fanwalls counts when photo is inserted
CREATE OR REPLACE FUNCTION public.update_artist_fanwall_on_photo_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update photo count and set featured photo if needed
  UPDATE public.artist_fanwalls
  SET 
    photo_count = photo_count + 1,
    featured_photo_url = COALESCE(featured_photo_url, NEW.display_url),
    updated_at = now()
  WHERE artist_name = NEW.artist;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_artist_fanwall_on_photo_insert
AFTER INSERT ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_artist_fanwall_on_photo_insert();

-- Trigger to update artist_fanwalls counts when photo is deleted
CREATE OR REPLACE FUNCTION public.update_artist_fanwall_on_photo_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artist_fanwalls
  SET 
    photo_count = GREATEST(photo_count - 1, 0),
    updated_at = now()
  WHERE artist_name = OLD.artist;
  
  -- Update featured photo if the deleted one was featured
  UPDATE public.artist_fanwalls af
  SET featured_photo_url = (
    SELECT display_url 
    FROM public.photos 
    WHERE artist = af.artist_name 
    ORDER BY like_count DESC, view_count DESC 
    LIMIT 1
  )
  WHERE artist_name = OLD.artist 
    AND featured_photo_url = OLD.display_url;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER update_artist_fanwall_on_photo_delete
AFTER DELETE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_artist_fanwall_on_photo_delete();

-- Trigger to update total_views when photo view is registered
CREATE OR REPLACE FUNCTION public.update_artist_fanwall_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artist_fanwalls
  SET total_views = total_views + 1
  WHERE artist_name = (SELECT artist FROM public.photos WHERE id = NEW.photo_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_artist_fanwall_views
AFTER INSERT ON public.photo_views
FOR EACH ROW
EXECUTE FUNCTION public.update_artist_fanwall_views();

-- Trigger to update total_likes when photo is liked/unliked
CREATE OR REPLACE FUNCTION public.update_artist_fanwall_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artist_fanwalls
    SET total_likes = total_likes + 1
    WHERE artist_name = (SELECT artist FROM public.photos WHERE id = NEW.photo_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artist_fanwalls
    SET total_likes = GREATEST(total_likes - 1, 0)
    WHERE artist_name = (SELECT artist FROM public.photos WHERE id = OLD.photo_id);
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER update_artist_fanwall_likes
AFTER INSERT OR DELETE ON public.photo_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_artist_fanwall_likes();