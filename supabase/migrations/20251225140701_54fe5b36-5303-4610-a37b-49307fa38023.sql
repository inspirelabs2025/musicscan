
-- First create a batch for singles
DO $$
DECLARE
  new_batch_id uuid;
BEGIN
  INSERT INTO batch_processing_status (
    process_type, 
    status, 
    total_items, 
    processed_items,
    successful_items,
    failed_items,
    started_at
  ) VALUES (
    'singles_story_generation',
    'active',
    100,
    0,
    0,
    0,
    NOW()
  ) RETURNING id INTO new_batch_id;
  
  -- Add singles without stories to the import queue
  INSERT INTO singles_import_queue (user_id, artist, single_name, discogs_id, batch_id, status)
  SELECT 
    '567d3376-a797-447c-86cb-4c2f1260e997'::uuid,
    ms.artist_name,
    ms.title,
    ms.discogs_master_id,
    new_batch_id,
    'pending'
  FROM master_singles ms
  WHERE (ms.has_story IS NULL OR ms.has_story = false)
    AND ms.artist_name IS NOT NULL
    AND ms.title IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM singles_import_queue siq 
      WHERE siq.discogs_id = ms.discogs_master_id
    )
  LIMIT 100;
END $$;
