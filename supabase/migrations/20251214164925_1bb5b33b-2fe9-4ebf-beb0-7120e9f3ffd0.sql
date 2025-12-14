-- Create master songs table for unique songs
CREATE TABLE public.top2000_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  artist_normalized TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  release_year INTEGER,
  artist_type TEXT,
  language TEXT,
  genre TEXT,
  subgenre TEXT,
  energy_level TEXT,
  decade TEXT,
  enriched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_normalized, title_normalized)
);

-- Add song_id reference to entries
ALTER TABLE public.top2000_entries 
ADD COLUMN song_id UUID REFERENCES public.top2000_songs(id);

-- Create index for faster lookups
CREATE INDEX idx_top2000_songs_normalized ON public.top2000_songs(artist_normalized, title_normalized);
CREATE INDEX idx_top2000_entries_song_id ON public.top2000_entries(song_id);

-- Populate top2000_songs with unique songs from existing entries
INSERT INTO public.top2000_songs (artist, title, artist_normalized, title_normalized, release_year)
SELECT DISTINCT ON (LOWER(TRIM(artist)), LOWER(TRIM(title)))
  artist,
  title,
  LOWER(TRIM(artist)),
  LOWER(TRIM(title)),
  release_year
FROM public.top2000_entries
WHERE artist IS NOT NULL AND title IS NOT NULL
ORDER BY LOWER(TRIM(artist)), LOWER(TRIM(title)), release_year DESC NULLS LAST;

-- Link existing entries to their songs
UPDATE public.top2000_entries e
SET song_id = s.id
FROM public.top2000_songs s
WHERE LOWER(TRIM(e.artist)) = s.artist_normalized
  AND LOWER(TRIM(e.title)) = s.title_normalized;

-- Enable RLS
ALTER TABLE public.top2000_songs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view top2000 songs"
ON public.top2000_songs FOR SELECT
USING (true);