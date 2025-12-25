-- Reset artists that were processed by old version (have last_crawled_at but no discogs_artist_id and albums_count=0)
-- This allows them to be reprocessed by the new AI-based discovery
UPDATE curated_artists 
SET last_crawled_at = NULL, albums_count = NULL 
WHERE is_active = true 
  AND discogs_artist_id IS NULL 
  AND albums_count = 0 
  AND last_crawled_at IS NOT NULL;