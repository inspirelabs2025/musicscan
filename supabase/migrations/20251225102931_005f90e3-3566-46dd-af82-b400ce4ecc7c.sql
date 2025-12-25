-- Create master_albums table to store all albums from curated artists
CREATE TABLE public.master_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.curated_artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  
  -- Album identifiers
  title TEXT NOT NULL,
  year INTEGER,
  discogs_master_id INTEGER,
  discogs_release_id INTEGER,
  discogs_url TEXT,
  
  -- Artwork (from Discogs)
  artwork_thumb TEXT,
  artwork_large TEXT,
  
  -- Album metadata
  format TEXT,
  genre TEXT,
  country TEXT,
  label TEXT,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending',
  has_blog BOOLEAN DEFAULT FALSE,
  blog_id UUID,
  has_products BOOLEAN DEFAULT FALSE,
  products_count INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraints to prevent duplicates
  CONSTRAINT unique_discogs_master UNIQUE (discogs_master_id),
  CONSTRAINT unique_artist_album UNIQUE (artist_name, title)
);

-- Add indexes for efficient querying
CREATE INDEX idx_master_albums_status ON public.master_albums(status);
CREATE INDEX idx_master_albums_artist_id ON public.master_albums(artist_id);
CREATE INDEX idx_master_albums_artist_name ON public.master_albums(artist_name);
CREATE INDEX idx_master_albums_discovered_at ON public.master_albums(discovered_at DESC);
CREATE INDEX idx_master_albums_pending ON public.master_albums(status, discovered_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.master_albums ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view master albums"
  ON public.master_albums FOR SELECT
  USING (true);

CREATE POLICY "System can manage master albums"
  ON public.master_albums FOR ALL
  USING (true);

-- Update trigger for updated_at
CREATE TRIGGER update_master_albums_updated_at
  BEFORE UPDATE ON public.master_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add discogs_id column to curated_artists if not exists (for artist lookup)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'curated_artists' 
    AND column_name = 'discogs_artist_id'
  ) THEN
    ALTER TABLE public.curated_artists ADD COLUMN discogs_artist_id INTEGER;
  END IF;
END $$;

-- Add index for discogs_artist_id lookup
CREATE INDEX IF NOT EXISTS idx_curated_artists_discogs_id ON public.curated_artists(discogs_artist_id);