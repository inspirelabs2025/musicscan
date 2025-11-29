-- Add is_deep_dive column to artist_stories
ALTER TABLE artist_stories 
ADD COLUMN IF NOT EXISTS is_deep_dive boolean DEFAULT false;

-- Update Miles Davis to be a deep dive (if exists)
UPDATE artist_stories 
SET is_deep_dive = true 
WHERE LOWER(artist_name) LIKE '%miles davis%';