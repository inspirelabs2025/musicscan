-- Reset failed discogs imports to pending for retry
UPDATE discogs_import_log 
SET 
  status = 'pending', 
  retry_count = 0, 
  error_message = NULL, 
  processed_at = NULL,
  updated_at = now()
WHERE status = 'failed';