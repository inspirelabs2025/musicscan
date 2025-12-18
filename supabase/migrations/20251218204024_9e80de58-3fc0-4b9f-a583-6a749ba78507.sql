-- Create studio_stories table for storing generated studio content
CREATE TABLE public.studio_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  location TEXT,
  country_code TEXT,
  founded_year INTEGER,
  artwork_url TEXT,
  story_content TEXT NOT NULL,
  famous_recordings TEXT[],
  notable_artists TEXT[],
  equipment_highlights TEXT[],
  architectural_features TEXT,
  cultural_impact TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0,
  reading_time INTEGER,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create studio_import_queue for batch processing
CREATE TABLE public.studio_import_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_name TEXT NOT NULL,
  location TEXT,
  country_code TEXT,
  founded_year INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  story_id UUID REFERENCES public.studio_stories(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_import_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for studio_stories (public read, admin write)
CREATE POLICY "Studio stories are publicly readable" 
ON public.studio_stories FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage studio stories" 
ON public.studio_stories FOR ALL 
USING (public.is_admin(auth.uid()));

-- RLS policies for studio_import_queue (admin only)
CREATE POLICY "Admins can manage studio queue" 
ON public.studio_import_queue FOR ALL 
USING (public.is_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_studio_stories_slug ON public.studio_stories(slug);
CREATE INDEX idx_studio_stories_published ON public.studio_stories(is_published, published_at DESC);
CREATE INDEX idx_studio_import_queue_status ON public.studio_import_queue(status);

-- Update trigger
CREATE TRIGGER update_studio_stories_updated_at
BEFORE UPDATE ON public.studio_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_import_queue_updated_at
BEFORE UPDATE ON public.studio_import_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();