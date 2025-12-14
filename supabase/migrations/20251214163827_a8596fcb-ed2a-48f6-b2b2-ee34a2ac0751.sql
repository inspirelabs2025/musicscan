-- Add enrichment columns to top2000_entries
ALTER TABLE public.top2000_entries 
ADD COLUMN IF NOT EXISTS artist_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS decade TEXT,
ADD COLUMN IF NOT EXISTS subgenre TEXT,
ADD COLUMN IF NOT EXISTS energy_level TEXT,
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE;

-- Create index for unenriched entries
CREATE INDEX IF NOT EXISTS idx_top2000_entries_enriched_at ON public.top2000_entries(enriched_at) WHERE enriched_at IS NULL;

-- Create per-year analysis table
CREATE TABLE IF NOT EXISTS public.top2000_year_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_year INTEGER NOT NULL UNIQUE,
  genre_distribution JSONB DEFAULT '{}'::jsonb,
  artist_type_distribution JSONB DEFAULT '{}'::jsonb,
  language_distribution JSONB DEFAULT '{}'::jsonb,
  decade_distribution JSONB DEFAULT '{}'::jsonb,
  dutch_percentage NUMERIC(5,2),
  top_10_summary TEXT,
  unique_insights TEXT[],
  total_entries INTEGER DEFAULT 0,
  enriched_entries INTEGER DEFAULT 0,
  analysis_narrative TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.top2000_year_analyses ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Year analyses are viewable by everyone" 
ON public.top2000_year_analyses 
FOR SELECT 
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage year analyses" 
ON public.top2000_year_analyses 
FOR ALL 
USING (is_admin(auth.uid()));