-- Create table for Facebook auto-posting settings
CREATE TABLE public.facebook_auto_post_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_type TEXT NOT NULL DEFAULT 'manual', -- manual, hourly, daily, weekly
  schedule_hour INTEGER DEFAULT 10, -- hour of day (0-23) for daily/weekly
  schedule_day INTEGER DEFAULT 1, -- day of week (0-6) for weekly
  max_posts_per_day INTEGER DEFAULT 5,
  include_image BOOLEAN DEFAULT true,
  include_url BOOLEAN DEFAULT true,
  custom_hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_auto_post_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_auto_post_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read/write settings
CREATE POLICY "Admins can manage auto-post settings" 
ON public.facebook_auto_post_settings 
FOR ALL 
USING (true);

-- Create table for content queue (manual selection)
CREATE TABLE public.facebook_content_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_preview TEXT,
  image_url TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, posted, failed, cancelled
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.facebook_content_queue ENABLE ROW LEVEL SECURITY;

-- Admin can manage queue
CREATE POLICY "Admins can manage content queue" 
ON public.facebook_content_queue 
FOR ALL 
USING (true);

-- Insert default settings for each content type
INSERT INTO public.facebook_auto_post_settings (content_type, is_enabled, schedule_type)
VALUES 
  ('blog_posts', false, 'manual'),
  ('platform_products', false, 'manual'),
  ('music_news', false, 'manual'),
  ('artist_stories', false, 'manual'),
  ('music_anecdotes', false, 'manual'),
  ('admin_album_reviews', false, 'manual');

-- Create trigger for updated_at
CREATE TRIGGER update_facebook_auto_post_settings_updated_at
BEFORE UPDATE ON public.facebook_auto_post_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_content_queue_updated_at
BEFORE UPDATE ON public.facebook_content_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();