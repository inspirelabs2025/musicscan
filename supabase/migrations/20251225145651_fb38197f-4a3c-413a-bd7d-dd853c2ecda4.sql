-- Add missing columns to photo_batch_queue for album processing
ALTER TABLE public.photo_batch_queue 
ADD COLUMN IF NOT EXISTS artist text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS discogs_id integer,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_id uuid,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url text;

-- Copy photo_url to image_url for existing records
UPDATE public.photo_batch_queue 
SET image_url = photo_url 
WHERE image_url IS NULL AND photo_url IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_batch_queue_source ON public.photo_batch_queue(source, source_id);
CREATE INDEX IF NOT EXISTS idx_photo_batch_queue_artist_title ON public.photo_batch_queue(artist, title);

-- Add comment for documentation
COMMENT ON COLUMN public.photo_batch_queue.source IS 'Source of the photo: manual, master_albums, etc.';
COMMENT ON COLUMN public.photo_batch_queue.source_id IS 'ID of the source record (e.g., master_albums.id)';