
-- Update one item to be scheduled for now for testing
UPDATE public.podcast_facebook_queue 
SET scheduled_for = now() - interval '1 minute'
WHERE id = '33667f3a-ec25-4988-a412-08987d38cc68'
