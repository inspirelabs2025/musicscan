-- Stop the batch processing
UPDATE batch_processing_status 
SET status = 'stopped', stopped_at = now() 
WHERE process_type = 'singles_import' AND status IN ('running', 'processing');

-- Swap artist and single_name in singles_import_queue (pending items only)
UPDATE singles_import_queue 
SET artist = single_name, single_name = artist 
WHERE status = 'pending';

-- Also swap in already completed/failed items in queue for consistency
UPDATE singles_import_queue 
SET artist = single_name, single_name = artist 
WHERE status IN ('completed', 'failed', 'processing');

-- Swap artist and single_name in already generated music_stories
UPDATE music_stories 
SET artist = single_name, single_name = artist 
WHERE single_name IS NOT NULL;