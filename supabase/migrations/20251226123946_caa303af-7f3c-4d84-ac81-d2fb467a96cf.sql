
-- Create album_facebook_queue for scheduling album story posts to Facebook
CREATE TABLE IF NOT EXISTS public.album_facebook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL,
  artist TEXT NOT NULL,
  album_title TEXT NOT NULL,
  slug TEXT NOT NULL,
  artwork_url TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_album_facebook_queue_status ON public.album_facebook_queue(status);
CREATE INDEX IF NOT EXISTS idx_album_facebook_queue_priority ON public.album_facebook_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_album_facebook_queue_slug ON public.album_facebook_queue(slug);

-- Enable RLS
ALTER TABLE public.album_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (edge functions)
CREATE POLICY "Service role can manage album_facebook_queue"
  ON public.album_facebook_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.album_facebook_queue IS 'Queue for scheduling album story posts to Facebook';
