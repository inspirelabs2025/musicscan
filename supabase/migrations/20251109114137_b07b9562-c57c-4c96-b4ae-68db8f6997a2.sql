-- Create lyric_posters table
CREATE TABLE IF NOT EXISTS public.lyric_posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Song info
  artist_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  album_name TEXT,
  release_year INTEGER,
  
  -- Lyrics content
  full_lyrics TEXT NOT NULL,
  highlight_lines TEXT NOT NULL,
  
  -- Design metadata
  style_preset TEXT DEFAULT 'auto',
  color_palette JSONB DEFAULT '{"primary":"#000000","secondary":"#FFFFFF","accent":"#FF0000"}',
  typography_hint TEXT,
  
  -- Generated assets
  poster_url TEXT,
  style_variants JSONB,
  qr_code_url TEXT,
  
  -- Product linking
  standard_product_id UUID REFERENCES public.platform_products(id),
  metal_product_id UUID REFERENCES public.platform_products(id),
  
  -- SEO & content
  slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT false,
  
  -- Legal safeguards
  copyright_status TEXT DEFAULT 'user-responsibility',
  license_type TEXT,
  copyright_notes TEXT,
  user_license_confirmed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.lyric_posters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view published lyric posters"
  ON public.lyric_posters FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own lyric posters"
  ON public.lyric_posters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lyric posters"
  ON public.lyric_posters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lyric posters"
  ON public.lyric_posters FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_lyric_posters_artist ON public.lyric_posters(artist_name);
CREATE INDEX idx_lyric_posters_published ON public.lyric_posters(is_published) WHERE is_published = true;
CREATE INDEX idx_lyric_posters_user ON public.lyric_posters(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lyric_posters_updated_at
  BEFORE UPDATE ON public.lyric_posters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();