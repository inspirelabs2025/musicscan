-- Create album_tshirts table
CREATE TABLE IF NOT EXISTS public.album_tshirts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Album Info
  artist_name TEXT NOT NULL,
  album_title TEXT NOT NULL,
  discogs_id INTEGER,
  discogs_master_id INTEGER,
  release_year INTEGER,
  genre TEXT,
  album_cover_url TEXT NOT NULL,
  
  -- Color Palette (from extract-album-colors)
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  accent_color TEXT,
  color_palette JSONB,
  design_theme TEXT,
  pattern_type TEXT DEFAULT 'stripes',
  
  -- T-shirt Designs
  base_design_url TEXT,
  mockup_url TEXT,
  style_variants JSONB,
  slug TEXT UNIQUE NOT NULL,
  
  -- Product Links
  product_id UUID,
  
  -- SEO & Content
  description TEXT,
  story_text TEXT,
  is_published BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  generation_time_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_album_tshirts_artist ON public.album_tshirts(artist_name);
CREATE INDEX IF NOT EXISTS idx_album_tshirts_discogs ON public.album_tshirts(discogs_id);
CREATE INDEX IF NOT EXISTS idx_album_tshirts_published ON public.album_tshirts(is_published);
CREATE INDEX IF NOT EXISTS idx_album_tshirts_slug ON public.album_tshirts(slug);
CREATE INDEX IF NOT EXISTS idx_album_tshirts_user ON public.album_tshirts(user_id);

-- Enable RLS
ALTER TABLE public.album_tshirts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published tshirts viewable by everyone"
  ON public.album_tshirts FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create tshirts"
  ON public.album_tshirts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tshirts"
  ON public.album_tshirts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tshirts"
  ON public.album_tshirts FOR DELETE
  USING (auth.uid() = user_id);