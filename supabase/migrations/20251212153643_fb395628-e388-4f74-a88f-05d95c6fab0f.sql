-- Add artwork_fetch_attempted column to track failed attempts
ALTER TABLE public.music_stories 
ADD COLUMN IF NOT EXISTS artwork_fetch_attempted boolean DEFAULT false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_stories_artwork_attempted 
ON public.music_stories(artwork_fetch_attempted) 
WHERE artwork_url IS NULL;