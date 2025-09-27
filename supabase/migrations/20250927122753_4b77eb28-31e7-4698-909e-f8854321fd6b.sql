-- Add new columns to music_stories table for enhanced content structure
ALTER TABLE public.music_stories 
ADD COLUMN IF NOT EXISTS yaml_frontmatter jsonb,
ADD COLUMN IF NOT EXISTS social_post text,
ADD COLUMN IF NOT EXISTS reading_time integer,
ADD COLUMN IF NOT EXISTS word_count integer,
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS artist text,
ADD COLUMN IF NOT EXISTS single_name text,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS catalog text,
ADD COLUMN IF NOT EXISTS album text,
ADD COLUMN IF NOT EXISTS genre text,
ADD COLUMN IF NOT EXISTS styles text[],
ADD COLUMN IF NOT EXISTS tags text[];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_stories_artist ON public.music_stories(artist);
CREATE INDEX IF NOT EXISTS idx_music_stories_year ON public.music_stories(year);
CREATE INDEX IF NOT EXISTS idx_music_stories_genre ON public.music_stories(genre);
CREATE INDEX IF NOT EXISTS idx_music_stories_tags ON public.music_stories USING GIN(tags);