-- Drop de oude unique constraint op artist_name
ALTER TABLE public.artist_stories 
DROP CONSTRAINT IF EXISTS artist_stories_artist_name_key;

-- Maak nieuwe composite unique constraint op (artist_name, is_spotlight)
-- Dit staat toe: 1 reguliere story + 1 spotlight per artiest
ALTER TABLE public.artist_stories 
ADD CONSTRAINT artist_stories_artist_name_is_spotlight_key 
UNIQUE (artist_name, is_spotlight);