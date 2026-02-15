-- Add slug column for SEO-friendly URLs
ALTER TABLE public.spotify_track_insights 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_spotify_track_insights_slug ON public.spotify_track_insights(slug);

-- Allow public read access for SEO (no auth needed to view track pages)
CREATE POLICY "Track insights are publicly readable"
ON public.spotify_track_insights
FOR SELECT
USING (true);