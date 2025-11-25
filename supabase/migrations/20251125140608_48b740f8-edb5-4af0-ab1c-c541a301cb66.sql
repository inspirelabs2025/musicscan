-- Create admin_album_reviews table for your personal album reviews
CREATE TABLE admin_album_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  
  -- Album info
  artist_name TEXT NOT NULL,
  album_title TEXT NOT NULL,
  release_year INTEGER,
  genre TEXT,
  label TEXT,
  format TEXT CHECK (format IN ('single', 'ep', 'lp', 'compilation')),
  
  -- Review content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Rating
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  rating_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Media
  cover_image_url TEXT,
  spotify_embed_url TEXT,
  youtube_embed_url TEXT,
  
  -- Metadata
  listening_context TEXT,
  recommended_for TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_album_reviews ENABLE ROW LEVEL SECURITY;

-- Published reviews viewable by everyone
CREATE POLICY "Published reviews viewable by everyone"
  ON admin_album_reviews
  FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);

-- Only admins can create reviews
CREATE POLICY "Admins can create reviews"
  ON admin_album_reviews
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can update reviews
CREATE POLICY "Admins can update reviews"
  ON admin_album_reviews
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Only admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON admin_album_reviews
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create index for slug lookups
CREATE INDEX idx_admin_album_reviews_slug ON admin_album_reviews(slug);

-- Create index for published reviews
CREATE INDEX idx_admin_album_reviews_published ON admin_album_reviews(is_published, published_at DESC);

-- Create index for genre filtering
CREATE INDEX idx_admin_album_reviews_genre ON admin_album_reviews(genre) WHERE is_published = true;

-- Trigger to update updated_at
CREATE TRIGGER update_admin_album_reviews_updated_at
  BEFORE UPDATE ON admin_album_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();