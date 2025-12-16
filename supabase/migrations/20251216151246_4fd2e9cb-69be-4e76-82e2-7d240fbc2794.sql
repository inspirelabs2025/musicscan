-- Fix stuck processing items in spotify_new_releases_processed
UPDATE spotify_new_releases_processed 
SET status = 'pending', processed_at = NULL, error_message = NULL 
WHERE status = 'processing';

-- Also reset any very old pending items that might be stuck
UPDATE spotify_new_releases_processed 
SET error_message = NULL 
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days';