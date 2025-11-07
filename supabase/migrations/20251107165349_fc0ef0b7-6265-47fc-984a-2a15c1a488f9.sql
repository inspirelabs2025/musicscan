-- Create time_machine_events table
CREATE TABLE IF NOT EXISTS public.time_machine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  event_title TEXT NOT NULL,
  event_subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  
  -- Concert Info
  artist_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_city TEXT NOT NULL,
  venue_country TEXT DEFAULT 'Nederland',
  concert_date DATE NOT NULL,
  tour_name TEXT,
  
  -- Historical Context
  historical_context TEXT,
  cultural_significance TEXT,
  attendance_count INTEGER,
  ticket_price_original NUMERIC(10,2),
  
  -- Visual Design
  poster_style TEXT,
  color_palette JSONB,
  typography_style TEXT,
  
  -- Story Content
  story_content TEXT NOT NULL,
  setlist JSONB,
  
  -- Archive Materials
  archive_photos JSONB,
  audio_fragments JSONB,
  press_reviews JSONB,
  fan_quotes JSONB,
  
  -- Product Info
  poster_image_url TEXT,
  metal_print_image_url TEXT,
  qr_code_url TEXT,
  edition_size INTEGER DEFAULT 250,
  price_poster NUMERIC(10,2) DEFAULT 59.00,
  price_metal NUMERIC(10,2) DEFAULT 119.00,
  
  -- SEO & Metadata
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Create indexes for time_machine_events
CREATE INDEX IF NOT EXISTS idx_time_machine_slug ON public.time_machine_events(slug);
CREATE INDEX IF NOT EXISTS idx_time_machine_artist ON public.time_machine_events(artist_name);
CREATE INDEX IF NOT EXISTS idx_time_machine_date ON public.time_machine_events(concert_date);
CREATE INDEX IF NOT EXISTS idx_time_machine_published ON public.time_machine_events(is_published);

-- Create time_machine_fan_memories table
CREATE TABLE IF NOT EXISTS public.time_machine_fan_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.time_machine_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory Content
  memory_text TEXT NOT NULL,
  was_present BOOLEAN DEFAULT false,
  discovery_story TEXT,
  
  -- Media
  photo_url TEXT,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats
  likes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fan_memories
CREATE INDEX IF NOT EXISTS idx_fan_memories_event ON public.time_machine_fan_memories(event_id);
CREATE INDEX IF NOT EXISTS idx_fan_memories_user ON public.time_machine_fan_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_memories_approved ON public.time_machine_fan_memories(is_approved);

-- Extend platform_products with time machine fields
ALTER TABLE public.platform_products 
ADD COLUMN IF NOT EXISTS time_machine_event_id UUID REFERENCES public.time_machine_events(id);

ALTER TABLE public.platform_products 
ADD COLUMN IF NOT EXISTS edition_number INTEGER;

ALTER TABLE public.platform_products 
ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

CREATE INDEX IF NOT EXISTS idx_products_time_machine ON public.platform_products(time_machine_event_id);

-- Enable RLS on time_machine_events
ALTER TABLE public.time_machine_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_machine_events
CREATE POLICY "Time Machine events are viewable by everyone"
  ON public.time_machine_events FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create time machine events"
  ON public.time_machine_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update time machine events"
  ON public.time_machine_events FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete time machine events"
  ON public.time_machine_events FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Enable RLS on time_machine_fan_memories
ALTER TABLE public.time_machine_fan_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fan_memories
CREATE POLICY "Approved fan memories are viewable by everyone"
  ON public.time_machine_fan_memories FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own fan memories"
  ON public.time_machine_fan_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fan memories"
  ON public.time_machine_fan_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fan memories"
  ON public.time_machine_fan_memories FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_time_machine_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_machine_events_updated_at
  BEFORE UPDATE ON public.time_machine_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_time_machine_updated_at();

CREATE TRIGGER update_fan_memories_updated_at
  BEFORE UPDATE ON public.time_machine_fan_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_time_machine_updated_at();