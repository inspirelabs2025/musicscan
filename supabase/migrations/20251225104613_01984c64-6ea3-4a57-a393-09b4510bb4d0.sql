-- Create master_singles table to store discovered singles
CREATE TABLE IF NOT EXISTS public.master_singles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Artist reference
  artist_id UUID REFERENCES public.curated_artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  discogs_artist_id INTEGER,
  
  -- Album reference (if from an album)
  album_id UUID REFERENCES public.master_albums(id) ON DELETE SET NULL,
  album_title TEXT,
  
  -- Single info
  title TEXT NOT NULL,
  year INTEGER,
  discogs_release_id INTEGER,
  discogs_master_id INTEGER,
  discogs_url TEXT,
  
  -- Artwork
  artwork_thumb TEXT,
  artwork_large TEXT,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
  has_story BOOLEAN DEFAULT FALSE,
  has_products BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  format TEXT,
  label TEXT,
  country TEXT,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicates
  CONSTRAINT unique_artist_single UNIQUE (artist_name, title),
  CONSTRAINT unique_discogs_single UNIQUE (discogs_release_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_master_singles_artist ON public.master_singles(artist_id);
CREATE INDEX IF NOT EXISTS idx_master_singles_status ON public.master_singles(status);
CREATE INDEX IF NOT EXISTS idx_master_singles_artist_name ON public.master_singles(artist_name);

-- Add singles_count to curated_artists if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curated_artists' AND column_name = 'singles_count'
  ) THEN
    ALTER TABLE public.curated_artists ADD COLUMN singles_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.master_singles ENABLE ROW LEVEL SECURITY;

-- RLS policy for public read
CREATE POLICY "Master singles are publicly readable"
  ON public.master_singles FOR SELECT
  USING (true);

-- RLS policy for admin write
CREATE POLICY "Admins can manage master singles"
  ON public.master_singles FOR ALL
  USING (public.is_admin(auth.uid()));

-- Update trigger
CREATE TRIGGER update_master_singles_updated_at
  BEFORE UPDATE ON public.master_singles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();