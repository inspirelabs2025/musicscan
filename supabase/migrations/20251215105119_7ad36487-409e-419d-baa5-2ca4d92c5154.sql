-- Update all Christmas story slugs to include 'kerst-' prefix
UPDATE music_stories 
SET slug = 'kerst-' || slug 
WHERE id IN (
  SELECT music_story_id 
  FROM christmas_import_queue 
  WHERE music_story_id IS NOT NULL
) 
AND slug NOT LIKE 'kerst-%';