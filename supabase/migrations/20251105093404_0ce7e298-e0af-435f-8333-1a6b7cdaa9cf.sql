-- Stop the older batch (77945f43) and skip its pending items
UPDATE batch_processing_status 
SET 
  status = 'stopped', 
  completed_at = now(), 
  updated_at = now()
WHERE id = '77945f43-ea3a-4496-bbe4-b8827af86270';

-- Mark all pending queue items from the old batch as skipped
UPDATE batch_queue_items 
SET 
  status = 'skipped', 
  updated_at = now()
WHERE batch_id = '77945f43-ea3a-4496-bbe4-b8827af86270' 
  AND status = 'pending';