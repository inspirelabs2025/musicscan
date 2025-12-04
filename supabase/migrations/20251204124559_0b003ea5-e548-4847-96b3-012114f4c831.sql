-- Create own_podcasts table for podcast/show metadata
CREATE TABLE public.own_podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  artwork_url TEXT,
  author TEXT NOT NULL DEFAULT 'MusicScan',
  owner_name TEXT NOT NULL DEFAULT 'MusicScan',
  owner_email TEXT NOT NULL DEFAULT 'podcast@musicscan.nl',
  language TEXT NOT NULL DEFAULT 'nl',
  category TEXT NOT NULL DEFAULT 'Music',
  subcategory TEXT,
  explicit BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  website_url TEXT DEFAULT 'https://musicscan.nl',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create own_podcast_episodes table for episodes
CREATE TABLE public.own_podcast_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID NOT NULL REFERENCES public.own_podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  audio_file_size BIGINT,
  audio_duration_seconds INTEGER,
  episode_number INTEGER,
  season_number INTEGER DEFAULT 1,
  episode_type TEXT DEFAULT 'full',
  artwork_url TEXT,
  transcript TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.own_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.own_podcast_episodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for own_podcasts
CREATE POLICY "Published podcasts viewable by everyone"
  ON public.own_podcasts FOR SELECT
  USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage podcasts"
  ON public.own_podcasts FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS policies for own_podcast_episodes
CREATE POLICY "Published episodes viewable by everyone"
  ON public.own_podcast_episodes FOR SELECT
  USING (
    is_published = true 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage episodes"
  ON public.own_podcast_episodes FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_own_podcasts_slug ON public.own_podcasts(slug);
CREATE INDEX idx_own_podcasts_published ON public.own_podcasts(is_published);
CREATE INDEX idx_own_podcast_episodes_podcast_id ON public.own_podcast_episodes(podcast_id);
CREATE INDEX idx_own_podcast_episodes_published ON public.own_podcast_episodes(is_published, published_at DESC);

-- Create storage bucket for podcast audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcast-audio', 
  'podcast-audio', 
  true,
  209715200,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4']
);

-- Storage policies for podcast-audio bucket
CREATE POLICY "Podcast audio publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'podcast-audio');

CREATE POLICY "Admins can upload podcast audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'podcast-audio' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update podcast audio"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'podcast-audio' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete podcast audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'podcast-audio' AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_own_podcasts_updated_at
  BEFORE UPDATE ON public.own_podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_own_podcast_episodes_updated_at
  BEFORE UPDATE ON public.own_podcast_episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();