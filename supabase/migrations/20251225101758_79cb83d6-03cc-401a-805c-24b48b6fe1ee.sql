-- Uitbreiding curated_artists tabel met tracking velden voor content status
ALTER TABLE public.curated_artists 
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS discogs_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_id TEXT,
ADD COLUMN IF NOT EXISTS has_artist_story BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS artist_story_id UUID REFERENCES public.artist_stories(id),
ADD COLUMN IF NOT EXISTS albums_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS albums_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS singles_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS singles_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_content_sync TIMESTAMPTZ;

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_curated_artists_has_story ON public.curated_artists(has_artist_story);
CREATE INDEX IF NOT EXISTS idx_curated_artists_genre ON public.curated_artists(genre);
CREATE INDEX IF NOT EXISTS idx_curated_artists_country ON public.curated_artists(country_code);

-- Comment voor documentatie
COMMENT ON TABLE public.curated_artists IS 'Master artists tabel - basis voor alle content generatie (artist stories, album verhalen, singles)';
COMMENT ON COLUMN public.curated_artists.has_artist_story IS 'True als er een artist_stories record bestaat voor deze artiest';
COMMENT ON COLUMN public.curated_artists.albums_processed IS 'Aantal blog_posts (album verhalen) gegenereerd voor deze artiest';
COMMENT ON COLUMN public.curated_artists.singles_processed IS 'Aantal music_stories (singles) gegenereerd voor deze artiest';
COMMENT ON COLUMN public.curated_artists.last_content_sync IS 'Laatste keer dat content status is gesynchroniseerd';