-- Top 2000 raw data entries
CREATE TABLE public.top2000_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  position INTEGER NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  album TEXT,
  release_year INTEGER,
  genres TEXT[],
  country TEXT,
  discogs_release_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, position)
);

-- Top 2000 analysis results (AI generated)
CREATE TABLE public.top2000_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_year INTEGER NOT NULL,
  years_covered INTEGER[] NOT NULL,
  main_narrative TEXT,
  key_insights JSONB,
  canon_tracks JSONB,
  dominant_artists JSONB,
  genre_shifts JSONB,
  dutch_analysis JSONB,
  decade_analysis JSONB,
  story_hooks JSONB,
  generation_time_ms INTEGER,
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.top2000_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top2000_analyses ENABLE ROW LEVEL SECURITY;

-- Public read access for both tables
CREATE POLICY "Public read access for top2000_entries"
ON public.top2000_entries
FOR SELECT
USING (true);

CREATE POLICY "Public read access for top2000_analyses"
ON public.top2000_analyses
FOR SELECT
USING (true);

-- Admin write access for entries
CREATE POLICY "Admin write access for top2000_entries"
ON public.top2000_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin write access for analyses
CREATE POLICY "Admin write access for top2000_analyses"
ON public.top2000_analyses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Index for efficient querying
CREATE INDEX idx_top2000_entries_year ON public.top2000_entries(year);
CREATE INDEX idx_top2000_entries_artist ON public.top2000_entries(artist);
CREATE INDEX idx_top2000_entries_position ON public.top2000_entries(position);

-- Trigger to auto-generate analysis when data is imported
CREATE OR REPLACE FUNCTION public.trigger_top2000_analysis()
RETURNS TRIGGER AS $$
DECLARE
  distinct_years INTEGER[];
BEGIN
  -- Get all distinct years in database
  SELECT ARRAY_AGG(DISTINCT year ORDER BY year) INTO distinct_years
  FROM public.top2000_entries;
  
  -- Only trigger if we have at least 2 years of data
  IF array_length(distinct_years, 1) >= 2 THEN
    -- Insert a pending analysis request (edge function will pick this up)
    INSERT INTO public.top2000_analyses (analysis_year, years_covered, main_narrative)
    VALUES (EXTRACT(YEAR FROM now())::INTEGER, distinct_years, 'PENDING')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger after bulk insert
CREATE TRIGGER on_top2000_data_import
AFTER INSERT ON public.top2000_entries
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_top2000_analysis();