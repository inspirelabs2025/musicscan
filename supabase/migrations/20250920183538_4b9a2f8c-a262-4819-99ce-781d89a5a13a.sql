-- Fix blog_posts_album_type_check constraint to allow 'ai' album type
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_album_type_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_album_type_check 
CHECK ((album_type = ANY (ARRAY['cd'::text, 'vinyl'::text, 'ai'::text])));

-- Reset all failed batch queue items to pending so they can be retried
UPDATE batch_queue_items 
SET status = 'pending', 
    attempts = 0, 
    error_message = NULL, 
    updated_at = now()
WHERE status = 'failed';