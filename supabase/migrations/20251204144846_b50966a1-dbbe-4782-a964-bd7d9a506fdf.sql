-- Add slug column to own_podcast_episodes
ALTER TABLE own_podcast_episodes ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for slug within podcast
CREATE UNIQUE INDEX IF NOT EXISTS idx_own_podcast_episodes_slug 
ON own_podcast_episodes(podcast_id, slug) WHERE slug IS NOT NULL;

-- Function to generate episode slug
CREATE OR REPLACE FUNCTION generate_episode_slug(title TEXT, season_number INTEGER, episode_number INTEGER)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Create slug from title
  base_slug := lower(title);
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Add season/episode if available
  IF season_number IS NOT NULL AND episode_number IS NOT NULL THEN
    base_slug := base_slug || '-s' || season_number || 'e' || episode_number;
  END IF;
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing episodes with slugs
UPDATE own_podcast_episodes 
SET slug = generate_episode_slug(title, season_number, episode_number)
WHERE slug IS NULL;

-- Add view tracking columns
ALTER TABLE own_podcast_episodes ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE own_podcasts ADD COLUMN IF NOT EXISTS total_listens INTEGER DEFAULT 0;