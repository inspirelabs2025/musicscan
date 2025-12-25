-- Reset failed artist story items to pending
UPDATE batch_queue_items 
SET status = 'pending', attempts = 0, error_message = NULL, updated_at = NOW() 
WHERE item_type = 'artist_story' AND status = 'failed';

-- Reset failed singles to pending
UPDATE singles_import_queue 
SET status = 'pending', attempts = 0, error_message = NULL, updated_at = NOW() 
WHERE status = 'failed';

-- Reset failed albums to pending
UPDATE master_albums 
SET status = 'pending', attempts = 0, error_message = NULL, updated_at = NOW() 
WHERE status = 'failed';