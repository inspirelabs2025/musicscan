-- Create Metricool post queue for unified multi-platform posting
CREATE TABLE public.metricool_post_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- music_history, single, youtube, anecdote, blog, product
  content_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  target_platforms TEXT[] NOT NULL DEFAULT ARRAY['tiktok'], -- tiktok, instagram, facebook, twitter, linkedin, bluesky
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, posted, failed, skipped
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  metricool_post_id TEXT,
  metricool_response JSONB,
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Metricool post log for historical records
CREATE TABLE public.metricool_post_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID REFERENCES public.metricool_post_queue(id),
  content_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  target_platforms TEXT[],
  metricool_post_id TEXT,
  metricool_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metricool_post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_post_log ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin full access to metricool_post_queue"
  ON public.metricool_post_queue
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin full access to metricool_post_log"
  ON public.metricool_post_log
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Indexes for efficient querying
CREATE INDEX idx_metricool_queue_status_scheduled ON public.metricool_post_queue(status, scheduled_for);
CREATE INDEX idx_metricool_queue_content_type ON public.metricool_post_queue(content_type);
CREATE INDEX idx_metricool_log_created_at ON public.metricool_post_log(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_metricool_queue_updated_at
  BEFORE UPDATE ON public.metricool_post_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();