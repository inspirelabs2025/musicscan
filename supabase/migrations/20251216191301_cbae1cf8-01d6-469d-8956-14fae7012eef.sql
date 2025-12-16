-- Reset failed Discogs import items for retry
UPDATE discogs_import_log
SET 
  status = 'pending',
  retry_count = 0,
  error_message = NULL,
  updated_at = NOW()
WHERE status = 'failed'
  AND error_message LIKE '%non-2xx%';