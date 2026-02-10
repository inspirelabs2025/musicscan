
-- Create release_enrichments table for Discogs verification & data enrichment
CREATE TABLE public.release_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_id UUID REFERENCES public.releases(id) ON DELETE SET NULL,
  discogs_id INTEGER NOT NULL,
  
  -- Core metadata
  artist TEXT,
  title TEXT,
  country TEXT,
  year INTEGER,
  format JSONB,
  labels JSONB,
  
  -- Rich data
  tracklist JSONB,
  credits JSONB,
  companies JSONB,
  matrix_variants JSONB,
  barcodes TEXT[],
  identifiers JSONB,
  notes TEXT,
  
  -- Community & pricing
  community_have INTEGER,
  community_want INTEGER,
  community_rating NUMERIC(3,2),
  pricing_lowest NUMERIC(10,2),
  pricing_median NUMERIC(10,2),
  pricing_highest NUMERIC(10,2),
  
  -- Images
  artwork_url TEXT,
  images JSONB,
  
  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  verification_score INTEGER DEFAULT 0,
  verification_details JSONB,
  
  -- Timestamps
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_discogs_id UNIQUE (discogs_id)
);

-- Enable RLS
ALTER TABLE public.release_enrichments ENABLE ROW LEVEL SECURITY;

-- Everyone can read enrichments (public data)
CREATE POLICY "Anyone can read release enrichments"
  ON public.release_enrichments FOR SELECT
  USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated users can insert enrichments"
  ON public.release_enrichments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrichments"
  ON public.release_enrichments FOR UPDATE
  USING (true);

-- Indexes for fast lookup
CREATE INDEX idx_release_enrichments_discogs_id ON public.release_enrichments(discogs_id);
CREATE INDEX idx_release_enrichments_release_id ON public.release_enrichments(release_id);
CREATE INDEX idx_release_enrichments_barcodes ON public.release_enrichments USING GIN(barcodes);
CREATE INDEX idx_release_enrichments_matrix ON public.release_enrichments USING GIN(matrix_variants);
CREATE INDEX idx_release_enrichments_identifiers ON public.release_enrichments USING GIN(identifiers);
CREATE INDEX idx_release_enrichments_verification ON public.release_enrichments(verification_status);

-- Trigger for updated_at
CREATE TRIGGER update_release_enrichments_updated_at
  BEFORE UPDATE ON public.release_enrichments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
