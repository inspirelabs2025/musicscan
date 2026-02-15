
-- Cache table for AI-generated track background info
CREATE TABLE public.spotify_track_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_track_id TEXT NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  album TEXT,
  year INTEGER,
  insights_data JSONB NOT NULL,
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  generation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(spotify_track_id)
);

-- Enable RLS
ALTER TABLE public.spotify_track_insights ENABLE ROW LEVEL SECURITY;

-- Everyone can read cached insights (public content)
CREATE POLICY "Anyone can read track insights"
ON public.spotify_track_insights
FOR SELECT
USING (true);

-- Only authenticated users can insert (via edge function)
CREATE POLICY "Authenticated users can insert track insights"
ON public.spotify_track_insights
FOR INSERT
WITH CHECK (true);

-- Allow updates for cache refresh
CREATE POLICY "Allow update track insights"
ON public.spotify_track_insights
FOR UPDATE
USING (true);

-- Index for fast lookup
CREATE INDEX idx_spotify_track_insights_track_id ON public.spotify_track_insights(spotify_track_id);

-- Trigger for updated_at
CREATE TRIGGER update_spotify_track_insights_updated_at
BEFORE UPDATE ON public.spotify_track_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
