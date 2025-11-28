-- Create table to log Facebook posts
CREATE TABLE IF NOT EXISTS public.facebook_post_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  url TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  facebook_post_id TEXT,
  facebook_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.facebook_post_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to facebook_post_log"
ON public.facebook_post_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for querying by content type and status
CREATE INDEX idx_facebook_post_log_content_type ON public.facebook_post_log(content_type);
CREATE INDEX idx_facebook_post_log_status ON public.facebook_post_log(status);
CREATE INDEX idx_facebook_post_log_created_at ON public.facebook_post_log(created_at DESC);