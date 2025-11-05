-- Remove duplicates from indexnow_queue (keep oldest per URL)
DELETE FROM indexnow_queue a
USING indexnow_queue b
WHERE a.id > b.id AND a.url = b.url;

-- Add unique constraint to url column to enable upsert operations
ALTER TABLE indexnow_queue
ADD CONSTRAINT indexnow_queue_url_unique UNIQUE (url);