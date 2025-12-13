-- Reset artwork_fetch_attempted for Christmas stories without artwork
-- This allows the backfill to retry with corrected item_id/item_type parameters
UPDATE music_stories 
SET artwork_fetch_attempted = false 
WHERE yaml_frontmatter->>'is_christmas' = 'true' 
  AND artwork_url IS NULL;