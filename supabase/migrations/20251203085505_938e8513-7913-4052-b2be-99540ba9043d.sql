-- Add slug column to spotify_new_releases_processed
ALTER TABLE public.spotify_new_releases_processed
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to generate slug from artist and album name
CREATE OR REPLACE FUNCTION generate_spotify_release_slug(artist_name TEXT, album_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from artist and album name
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        concat(artist_name, '-', album_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
  
  -- Limit length to 100 characters
  base_slug := left(base_slug, 100);
  
  -- Remove trailing hyphens
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM spotify_new_releases_processed WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION auto_generate_spotify_release_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_spotify_release_slug(NEW.artist, NEW.album_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_spotify_release_slug ON spotify_new_releases_processed;
CREATE TRIGGER trigger_auto_generate_spotify_release_slug
BEFORE INSERT ON spotify_new_releases_processed
FOR EACH ROW
EXECUTE FUNCTION auto_generate_spotify_release_slug();

-- Backfill existing records with slugs
UPDATE spotify_new_releases_processed
SET slug = generate_spotify_release_slug(artist, album_name)
WHERE slug IS NULL;