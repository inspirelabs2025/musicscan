
-- Step 1: Update batch status to running
UPDATE batch_processing_status
SET status = 'running',
    started_at = NOW(),
    last_heartbeat = NOW(),
    processed_items = 0,
    successful_items = 0,
    failed_items = 0
WHERE id = '926dc225-3544-4823-b9c4-f33342027b70';

-- Step 2: Add albums to batch_queue_items for the blog processor (item_id is UUID)
INSERT INTO batch_queue_items (
  batch_id,
  item_id,
  item_type,
  status,
  metadata,
  priority
)
SELECT 
  '926dc225-3544-4823-b9c4-f33342027b70'::uuid,
  ma.id,
  'blog_post',
  'pending',
  jsonb_build_object(
    'artist_name', ma.artist_name,
    'album_title', ma.title,
    'artwork_url', COALESCE(ma.artwork_large, ma.artwork_thumb),
    'discogs_master_id', ma.discogs_master_id,
    'year', ma.year
  ),
  1
FROM master_albums ma
WHERE ma.status = 'pending' 
  AND (ma.artwork_large IS NOT NULL OR ma.artwork_thumb IS NOT NULL)
  AND ma.has_blog IS NOT TRUE
  AND NOT EXISTS (
    SELECT 1 FROM batch_queue_items bqi 
    WHERE bqi.item_id = ma.id 
      AND bqi.item_type = 'blog_post'
  )
LIMIT 50;
