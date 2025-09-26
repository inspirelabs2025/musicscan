-- Create table for curated Spotify shows
CREATE TABLE public.spotify_curated_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_show_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  publisher TEXT,
  image_url TEXT,
  spotify_url TEXT,
  total_episodes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'General',
  curator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for show episodes
CREATE TABLE public.spotify_show_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.spotify_curated_shows(id) ON DELETE CASCADE,
  spotify_episode_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  audio_preview_url TEXT,
  release_date DATE,
  duration_ms INTEGER,
  spotify_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotify_curated_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_show_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for curated shows (public read, admin write)
CREATE POLICY "Curated shows are viewable by everyone" 
ON public.spotify_curated_shows 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage curated shows" 
ON public.spotify_curated_shows 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for episodes (public read, admin write)
CREATE POLICY "Show episodes are viewable by everyone" 
ON public.spotify_show_episodes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage show episodes" 
ON public.spotify_show_episodes 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add indexes for better performance
CREATE INDEX idx_spotify_curated_shows_spotify_id ON public.spotify_curated_shows(spotify_show_id);
CREATE INDEX idx_spotify_curated_shows_category ON public.spotify_curated_shows(category);
CREATE INDEX idx_spotify_curated_shows_active ON public.spotify_curated_shows(is_active);
CREATE INDEX idx_spotify_show_episodes_show_id ON public.spotify_show_episodes(show_id);
CREATE INDEX idx_spotify_show_episodes_spotify_id ON public.spotify_show_episodes(spotify_episode_id);
CREATE INDEX idx_spotify_show_episodes_featured ON public.spotify_show_episodes(is_featured);
CREATE INDEX idx_spotify_show_episodes_release_date ON public.spotify_show_episodes(release_date DESC);