-- Add producers and youtube_videos columns to studio_stories
ALTER TABLE public.studio_stories 
ADD COLUMN IF NOT EXISTS producers TEXT[],
ADD COLUMN IF NOT EXISTS youtube_videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anecdotes TEXT;