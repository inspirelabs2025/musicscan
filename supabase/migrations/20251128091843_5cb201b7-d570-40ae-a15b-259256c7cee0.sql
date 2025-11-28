-- Create youtube_discoveries table for storing curated music videos
CREATE TABLE public.youtube_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT,
  channel_id TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration TEXT,
  view_count INTEGER,
  content_type TEXT NOT NULL CHECK (content_type IN ('interview', 'studio', 'live_session', 'documentary', 'other')),
  artist_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  source_channel TEXT,
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_youtube_discoveries_artist ON public.youtube_discoveries(artist_name);
CREATE INDEX idx_youtube_discoveries_content_type ON public.youtube_discoveries(content_type);
CREATE INDEX idx_youtube_discoveries_user_id ON public.youtube_discoveries(user_id);
CREATE INDEX idx_youtube_discoveries_featured ON public.youtube_discoveries(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.youtube_discoveries ENABLE ROW LEVEL SECURITY;

-- Public can view all discoveries
CREATE POLICY "Anyone can view discoveries"
  ON public.youtube_discoveries
  FOR SELECT
  USING (true);

-- Authenticated users can insert discoveries
CREATE POLICY "Authenticated users can insert discoveries"
  ON public.youtube_discoveries
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own discoveries
CREATE POLICY "Users can update own discoveries"
  ON public.youtube_discoveries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_youtube_discoveries_updated_at
  BEFORE UPDATE ON public.youtube_discoveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();