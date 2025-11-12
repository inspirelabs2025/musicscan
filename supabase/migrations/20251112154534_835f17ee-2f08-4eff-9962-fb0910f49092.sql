-- Create artist_stories table
CREATE TABLE public.artist_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  artist_name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  story_content TEXT NOT NULL,
  biography TEXT,
  music_style TEXT[],
  notable_albums TEXT[],
  cultural_impact TEXT,
  discogs_artist_id INTEGER,
  artwork_url TEXT,
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  reading_time INTEGER,
  word_count INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.artist_stories ENABLE ROW LEVEL SECURITY;

-- Policies for artist_stories
CREATE POLICY "Artist stories are viewable by everyone"
  ON public.artist_stories
  FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create artist stories"
  ON public.artist_stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist stories"
  ON public.artist_stories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artist stories"
  ON public.artist_stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_artist_stories_slug ON public.artist_stories(slug);
CREATE INDEX idx_artist_stories_artist_name ON public.artist_stories(artist_name);
CREATE INDEX idx_artist_stories_published ON public.artist_stories(is_published, published_at DESC);
CREATE INDEX idx_artist_stories_views ON public.artist_stories(views_count DESC);

-- Trigger for updated_at
CREATE TRIGGER update_artist_stories_updated_at
  BEFORE UPDATE ON public.artist_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();