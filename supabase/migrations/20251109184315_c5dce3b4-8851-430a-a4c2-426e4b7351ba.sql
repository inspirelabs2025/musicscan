-- Create album_socks table
CREATE TABLE album_socks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Album Info (from Discogs)
  artist_name TEXT NOT NULL,
  album_title TEXT NOT NULL,
  discogs_id INTEGER,
  discogs_master_id INTEGER,
  album_cover_url TEXT NOT NULL,
  release_year INTEGER,
  genre TEXT,
  
  -- Color Extraction (AI-generated)
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  accent_color TEXT,
  color_palette JSONB,
  
  -- Design Metadata
  design_theme TEXT,
  pattern_type TEXT DEFAULT 'stripes',
  
  -- Generated Assets
  base_design_url TEXT,
  mockup_url TEXT,
  style_variants JSONB,
  
  -- Product Linking
  standard_product_id UUID REFERENCES platform_products(id),
  premium_product_id UUID REFERENCES platform_products(id),
  
  -- SEO & Content
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  story_text TEXT,
  is_published BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  generation_time_ms INTEGER
);

-- Indexes for performance
CREATE INDEX idx_album_socks_artist ON album_socks(artist_name);
CREATE INDEX idx_album_socks_discogs ON album_socks(discogs_id);
CREATE INDEX idx_album_socks_published ON album_socks(is_published);
CREATE INDEX idx_album_socks_slug ON album_socks(slug);
CREATE INDEX idx_album_socks_user ON album_socks(user_id);

-- Enable RLS
ALTER TABLE album_socks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published socks viewable by everyone"
  ON album_socks FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create socks"
  ON album_socks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own socks"
  ON album_socks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own socks"
  ON album_socks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_album_socks_updated_at
  BEFORE UPDATE ON album_socks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();