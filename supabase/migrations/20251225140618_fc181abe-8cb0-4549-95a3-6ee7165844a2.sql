
-- Fix 1: Create new batch for orphaned artist_story items
DO $$
DECLARE
  new_batch_id uuid;
  pending_count integer;
BEGIN
  -- Count orphaned pending items
  SELECT COUNT(*) INTO pending_count
  FROM batch_queue_items bqi
  JOIN batch_processing_status bps ON bqi.batch_id = bps.id
  WHERE bqi.item_type = 'artist_story' 
    AND bqi.status = 'pending' 
    AND bps.status = 'completed';
  
  IF pending_count > 0 THEN
    -- Create new active batch
    INSERT INTO batch_processing_status (
      process_type, 
      status, 
      total_items, 
      processed_items,
      successful_items,
      failed_items,
      started_at
    ) VALUES (
      'artist_story_generation',
      'active',
      pending_count,
      0,
      0,
      0,
      NOW()
    ) RETURNING id INTO new_batch_id;
    
    -- Move orphaned items to new batch
    UPDATE batch_queue_items bqi
    SET batch_id = new_batch_id
    FROM batch_processing_status bps
    WHERE bqi.batch_id = bps.id
      AND bqi.item_type = 'artist_story' 
      AND bqi.status = 'pending' 
      AND bps.status = 'completed';
      
    RAISE NOTICE 'Created new batch % with % items', new_batch_id, pending_count;
  END IF;
END $$;
