-- Clean up stuck "processing" items in sitemap_regeneration_queue
UPDATE sitemap_regeneration_queue 
SET status = 'processed', processed_at = NOW() 
WHERE status = 'processing' 
AND queued_at < NOW() - INTERVAL '1 hour';