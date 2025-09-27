-- Add RSS feed support to curated shows
ALTER TABLE spotify_curated_shows 
ADD COLUMN rss_feed_url TEXT,
ADD COLUMN feed_type TEXT DEFAULT 'spotify',
ADD COLUMN last_rss_sync TIMESTAMP WITH TIME ZONE;

-- Create table for RSS feed episodes
CREATE TABLE rss_feed_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES spotify_curated_shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  published_date TIMESTAMP WITH TIME ZONE,
  episode_number INTEGER,
  season_number INTEGER,
  file_size BIGINT,
  mime_type TEXT DEFAULT 'audio/mpeg',
  guid TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(show_id, guid)
);

-- Enable RLS
ALTER TABLE rss_feed_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for RSS feed episodes
CREATE POLICY "RSS feed episodes are viewable by everyone" 
ON rss_feed_episodes FOR SELECT 
USING (true);

CREATE POLICY "System can manage RSS feed episodes" 
ON rss_feed_episodes FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_rss_feed_episodes_show_id ON rss_feed_episodes(show_id);
CREATE INDEX idx_rss_feed_episodes_published_date ON rss_feed_episodes(published_date DESC);
CREATE INDEX idx_rss_feed_episodes_featured ON rss_feed_episodes(is_featured) WHERE is_featured = true;