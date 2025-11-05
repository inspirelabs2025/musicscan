-- Reset stuck batch queue item and reactivate latest blog generation batch
-- Reset the processing item back to pending
UPDATE batch_queue_items 
SET status = 'pending', 
    attempts = 0, 
    error_message = NULL,
    updated_at = now()
WHERE status = 'processing';

-- Reactivate the most recent blog_generation batch
UPDATE batch_processing_status 
SET status = 'running', 
    updated_at = now(),
    last_heartbeat = now()
WHERE id = '001497b9-2f44-4c3d-b0d5-5b1842aaa4da'
  AND process_type = 'blog_generation';