-- Create TikTok post queue table
CREATE TABLE public.tiktok_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID,
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT,
  video_url TEXT,
  hashtags TEXT[],
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'posted', 'failed', 'skipped')),
  tiktok_post_id TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  posted_at TIMESTAMPTZ
);

-- Create TikTok post log table for history
CREATE TABLE public.tiktok_post_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID,
  title TEXT,
  caption TEXT,
  media_url TEXT,
  tiktok_post_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_post_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admins can manage tiktok queue" ON public.tiktok_post_queue
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view tiktok logs" ON public.tiktok_post_log
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create indexes for efficient querying
CREATE INDEX idx_tiktok_queue_status ON public.tiktok_post_queue(status);
CREATE INDEX idx_tiktok_queue_scheduled ON public.tiktok_post_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_tiktok_queue_content_type ON public.tiktok_post_queue(content_type);
CREATE INDEX idx_tiktok_log_created ON public.tiktok_post_log(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_tiktok_queue_updated_at
  BEFORE UPDATE ON public.tiktok_post_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();