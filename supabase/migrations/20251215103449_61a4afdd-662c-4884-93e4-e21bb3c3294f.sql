-- Update all Christmas songs in music_stories with christmas/kerst tags
-- This ensures proper filtering by tags instead of title matching

UPDATE music_stories
SET tags = COALESCE(tags, '{}') || ARRAY['christmas', 'kerst']::text[]
WHERE id IN (
  SELECT music_story_id 
  FROM christmas_import_queue 
  WHERE music_story_id IS NOT NULL
)
AND NOT (tags @> ARRAY['christmas']::text[]);