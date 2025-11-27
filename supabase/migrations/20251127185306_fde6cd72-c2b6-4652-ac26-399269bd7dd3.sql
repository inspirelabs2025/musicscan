-- Create media_library table for cloud storage box
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'artist-images',
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  
  -- AI Recognition
  ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'analyzing', 'completed', 'failed')),
  recognized_artist TEXT,
  artist_confidence NUMERIC,
  ai_tags TEXT[],
  ai_description TEXT,
  alternative_artists TEXT[],
  ai_context_type TEXT,
  ai_reasoning TEXT,
  
  -- Manual overrides
  manual_artist TEXT,
  manual_tags TEXT[],
  notes TEXT,
  
  -- Product routing tracking
  sent_to_posters BOOLEAN DEFAULT FALSE,
  sent_to_socks BOOLEAN DEFAULT FALSE,
  sent_to_buttons BOOLEAN DEFAULT FALSE,
  sent_to_tshirts BOOLEAN DEFAULT FALSE,
  sent_to_fanwall BOOLEAN DEFAULT FALSE,
  sent_to_canvas BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access
CREATE POLICY "Admins can view all media library items"
  ON public.media_library FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert media library items"
  ON public.media_library FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update media library items"
  ON public.media_library FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete media library items"
  ON public.media_library FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Update timestamp trigger
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_media_library_ai_status ON public.media_library(ai_status);
CREATE INDEX idx_media_library_recognized_artist ON public.media_library(recognized_artist);
CREATE INDEX idx_media_library_created_at ON public.media_library(created_at DESC);