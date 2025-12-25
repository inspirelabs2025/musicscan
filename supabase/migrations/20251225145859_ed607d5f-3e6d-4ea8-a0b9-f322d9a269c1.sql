-- Make photo_url nullable since we now use image_url
ALTER TABLE public.photo_batch_queue ALTER COLUMN photo_url DROP NOT NULL;