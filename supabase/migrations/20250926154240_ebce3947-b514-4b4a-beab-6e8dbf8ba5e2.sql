-- Create table for individual Spotify episodes
CREATE TABLE public.spotify_individual_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_episode_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  show_name TEXT NOT NULL,
  audio_preview_url TEXT,
  spotify_url TEXT NOT NULL,
  release_date DATE,
  duration_ms INTEGER,
  is_featured BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'General',
  curator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotify_individual_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for individual episodes
CREATE POLICY "Individual episodes are viewable by everyone" 
ON public.spotify_individual_episodes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create individual episodes" 
ON public.spotify_individual_episodes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update individual episodes" 
ON public.spotify_individual_episodes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete individual episodes" 
ON public.spotify_individual_episodes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_spotify_individual_episodes_updated_at
BEFORE UPDATE ON public.spotify_individual_episodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();