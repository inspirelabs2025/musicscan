-- Add artwork_url column to music_stories for storing cover images
ALTER TABLE public.music_stories
ADD COLUMN IF NOT EXISTS artwork_url text;