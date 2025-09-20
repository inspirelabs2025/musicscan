-- Database repair: Reset batch status to active and fix queue_size synchronization
UPDATE batch_processing_status 
SET status = 'active',
    completed_at = NULL,
    last_heartbeat = now(),
    updated_at = now(),
    queue_size = (
      SELECT COUNT(*) 
      FROM batch_queue_items 
      WHERE batch_id = batch_processing_status.id
    )
WHERE process_type = 'blog_generation' 
  AND status = 'completed'
  AND EXISTS (
    SELECT 1 FROM batch_queue_items 
    WHERE batch_id = batch_processing_status.id 
      AND status = 'pending'
  );