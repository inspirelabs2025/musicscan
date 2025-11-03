-- Start batch generation voor 49 art products zonder blog
-- Stap 1: Maak nieuwe batch aan
WITH new_batch AS (
  INSERT INTO batch_processing_status (
    id,
    process_type,
    status,
    total_items,
    processed_items,
    successful_items,
    failed_items,
    started_at,
    queue_size,
    last_heartbeat,
    auto_mode,
    created_at,
    updated_at
  )
  SELECT 
    gen_random_uuid(),
    'blog_generation',
    'active',
    COUNT(*),
    0,
    0,
    0,
    now(),
    COUNT(*),
    now(),
    true,
    now(),
    now()
  FROM platform_products pp
  LEFT JOIN blog_posts bp ON bp.album_id = pp.id AND bp.album_type = 'product'
  WHERE pp.media_type = 'art' 
    AND bp.id IS NULL
  RETURNING id, total_items
)
-- Stap 2: Voeg alle art products toe aan queue
INSERT INTO batch_queue_items (
  batch_id,
  item_id,
  item_type,
  priority,
  status,
  attempts,
  max_attempts,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM new_batch),
  pp.id,
  'product',
  4, -- Hoogste prioriteit
  'pending',
  0,
  3,
  now(),
  now()
FROM platform_products pp
LEFT JOIN blog_posts bp ON bp.album_id = pp.id AND bp.album_type = 'product'
WHERE pp.media_type = 'art' 
  AND bp.id IS NULL
ORDER BY pp.created_at DESC;