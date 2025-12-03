-- Add sources column to year_overview_cache table
ALTER TABLE public.year_overview_cache 
ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '{"spotify": false, "discogs": false, "perplexity": false}'::jsonb;