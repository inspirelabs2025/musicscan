-- Create Spotify integration tables

-- Create spotify_playlists table
CREATE TABLE public.spotify_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spotify_playlist_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  track_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  image_url TEXT,
  spotify_url TEXT,
  owner_id TEXT,
  snapshot_id TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spotify_tracks table
CREATE TABLE public.spotify_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spotify_track_id TEXT NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  year INTEGER,
  popularity INTEGER,
  duration_ms INTEGER,
  explicit BOOLEAN DEFAULT false,
  preview_url TEXT,
  spotify_url TEXT,
  image_url TEXT,
  audio_features JSONB,
  playlist_id UUID,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spotify_user_stats table for top tracks/artists
CREATE TABLE public.spotify_user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stat_type TEXT NOT NULL, -- 'top_tracks' or 'top_artists'
  time_range TEXT NOT NULL, -- 'short_term', 'medium_term', 'long_term'
  spotify_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Spotify fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_user_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_sync_enabled BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.spotify_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spotify_playlists
CREATE POLICY "Users can view their own spotify playlists" 
ON public.spotify_playlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spotify playlists" 
ON public.spotify_playlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify playlists" 
ON public.spotify_playlists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify playlists" 
ON public.spotify_playlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for spotify_tracks
CREATE POLICY "Users can view their own spotify tracks" 
ON public.spotify_tracks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spotify tracks" 
ON public.spotify_tracks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify tracks" 
ON public.spotify_tracks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify tracks" 
ON public.spotify_tracks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for spotify_user_stats
CREATE POLICY "Users can view their own spotify stats" 
ON public.spotify_user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spotify stats" 
ON public.spotify_user_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify stats" 
ON public.spotify_user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify stats" 
ON public.spotify_user_stats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.spotify_playlists 
ADD CONSTRAINT fk_spotify_playlists_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.spotify_tracks 
ADD CONSTRAINT fk_spotify_tracks_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.spotify_tracks 
ADD CONSTRAINT fk_spotify_tracks_playlist_id 
FOREIGN KEY (playlist_id) REFERENCES public.spotify_playlists(id) ON DELETE SET NULL;

ALTER TABLE public.spotify_user_stats 
ADD CONSTRAINT fk_spotify_user_stats_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_spotify_playlists_user_id ON public.spotify_playlists(user_id);
CREATE INDEX idx_spotify_tracks_user_id ON public.spotify_tracks(user_id);
CREATE INDEX idx_spotify_tracks_playlist_id ON public.spotify_tracks(playlist_id);
CREATE INDEX idx_spotify_user_stats_user_id ON public.spotify_user_stats(user_id);
CREATE INDEX idx_spotify_user_stats_type_range ON public.spotify_user_stats(user_id, stat_type, time_range);

-- Create triggers for updated_at columns
CREATE TRIGGER update_spotify_playlists_updated_at
BEFORE UPDATE ON public.spotify_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spotify_tracks_updated_at
BEFORE UPDATE ON public.spotify_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spotify_user_stats_updated_at
BEFORE UPDATE ON public.spotify_user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();