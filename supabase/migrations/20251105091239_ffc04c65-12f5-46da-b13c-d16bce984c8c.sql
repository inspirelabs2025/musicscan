-- Stop de dubbele batch en clear queue items
UPDATE batch_processing_status 
SET 
  status = 'stopped',
  completed_at = now(),
  updated_at = now()
WHERE id = 'a5f8bc5a-8354-4b9a-bffd-fbae3874686c'
  AND process_type = 'blog_generation';

-- Mark alle queue items van deze batch als skipped
UPDATE batch_queue_items 
SET 
  status = 'skipped',
  updated_at = now()
WHERE batch_id = 'a5f8bc5a-8354-4b9a-bffd-fbae3874686c'
  AND status = 'pending';