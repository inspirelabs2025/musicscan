-- Reset artists that were touched by old discogs-lp-crawler (have last_crawled_at but no discogs_artist_id and albums_count IS NULL)
UPDATE curated_artists 
SET last_crawled_at = NULL 
WHERE is_active = true 
  AND discogs_artist_id IS NULL 
  AND albums_count IS NULL 
  AND last_crawled_at IS NOT NULL;