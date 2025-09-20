-- 1) Stop alle bestaande blog_generation batches hard + reset timestamps
UPDATE batch_processing_status 
SET status = 'stopped',
    stopped_at = now(),
    updated_at = now()
WHERE process_type = 'blog_generation' 
  AND status IN ('active','running','paused');

-- 2) Queue volledig leegmaken
DELETE FROM batch_queue_items;

-- 3) Nieuwe actieve batch aanmaken en items in de queue plaatsen
WITH new_batch AS (
  INSERT INTO batch_processing_status (
    status,
    process_type,
    total_items,
    processed_items,
    successful_items,
    failed_items,
    queue_size,
    current_batch,
    started_at,
    last_heartbeat,
    auto_mode
  ) VALUES (
    'active',               -- status
    'blog_generation',      -- process_type
    0,                      -- total_items (wordt hieronder geüpdatet)
    0,                      -- processed_items
    0,                      -- successful_items
    0,                      -- failed_items
    0,                      -- queue_size (wordt hieronder geüpdatet)
    1,                      -- current_batch
    now(),                  -- started_at
    now(),                  -- last_heartbeat
    true                    -- auto_mode
  ) RETURNING id
),
queued AS (
  INSERT INTO batch_queue_items (
    batch_id,
    item_id,
    item_type,
    priority,
    status,
    attempts,
    max_attempts
  )
  -- CDs eerst (hoogste prioriteit 3)
  SELECT nb.id, s.id, 'cd'::text, 3, 'pending', 0, 3
  FROM cd_scan s
  CROSS JOIN new_batch nb
  WHERE NOT EXISTS (
    SELECT 1 FROM blog_posts b WHERE b.album_id = s.id
  )
  UNION ALL
  -- Vinyl (prioriteit 2)
  SELECT nb.id, v.id, 'vinyl'::text, 2, 'pending', 0, 3
  FROM vinyl2_scan v
  CROSS JOIN new_batch nb
  WHERE NOT EXISTS (
    SELECT 1 FROM blog_posts b WHERE b.album_id = v.id
  )
  UNION ALL
  -- AI scans (prioriteit 1, filter op confidence >= 0.7 indien aanwezig)
  SELECT nb.id, a.id, 'ai'::text, 1, 'pending', 0, 3
  FROM ai_scan_results a
  CROSS JOIN new_batch nb
  WHERE (a.confidence_score IS NULL OR a.confidence_score >= 0.7)
    AND NOT EXISTS (
      SELECT 1 FROM blog_posts b WHERE b.album_id = a.id
    )
  RETURNING batch_id
),
counts AS (
  SELECT nb.id AS batch_id, COUNT(q.batch_id) AS total
  FROM new_batch nb
  LEFT JOIN batch_queue_items q ON q.batch_id = nb.id
  GROUP BY nb.id
)
UPDATE batch_processing_status b
SET total_items = c.total,
    queue_size = c.total,
    updated_at = now()
FROM counts c
WHERE b.id = c.batch_id;
