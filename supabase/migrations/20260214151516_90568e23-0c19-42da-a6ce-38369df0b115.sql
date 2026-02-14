
-- Add Spotify profile fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS spotify_avatar_url text,
  ADD COLUMN IF NOT EXISTS spotify_country text,
  ADD COLUMN IF NOT EXISTS spotify_followers integer;

-- Create recently played table
CREATE TABLE IF NOT EXISTS public.spotify_recently_played (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  spotify_track_id text NOT NULL,
  artist text NOT NULL,
  title text NOT NULL,
  album text,
  image_url text,
  spotify_url text,
  duration_ms integer,
  played_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_spotify_recently_played_unique 
  ON public.spotify_recently_played (user_id, spotify_track_id, played_at);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_spotify_recently_played_user 
  ON public.spotify_recently_played (user_id, played_at DESC);

-- Enable RLS
ALTER TABLE public.spotify_recently_played ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own recently played" 
  ON public.spotify_recently_played FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert recently played" 
  ON public.spotify_recently_played FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can delete recently played" 
  ON public.spotify_recently_played FOR DELETE 
  USING (true);
