-- Create Instagram post log table
CREATE TABLE IF NOT EXISTS public.instagram_post_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  image_url TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  instagram_post_id TEXT,
  instagram_response JSONB,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_post_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage instagram_post_log"
  ON public.instagram_post_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for querying
CREATE INDEX idx_instagram_post_log_status ON public.instagram_post_log(status);
CREATE INDEX idx_instagram_post_log_created ON public.instagram_post_log(created_at DESC);