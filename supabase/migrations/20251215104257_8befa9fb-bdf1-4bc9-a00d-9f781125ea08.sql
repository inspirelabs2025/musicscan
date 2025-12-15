-- Update all Christmas songs with christmas/kerst tags
-- First ensure tags column has default empty array, then update
UPDATE music_stories
SET tags = ARRAY['christmas', 'kerst']::text[]
WHERE id IN (
  SELECT music_story_id 
  FROM christmas_import_queue 
  WHERE music_story_id IS NOT NULL
);