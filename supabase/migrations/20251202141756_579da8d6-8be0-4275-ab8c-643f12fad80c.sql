-- Create threads_post_log table for tracking Threads posts
CREATE TABLE public.threads_post_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  threads_post_id TEXT,
  error_message TEXT,
  threads_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.threads_post_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can view threads post log"
ON public.threads_post_log
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert threads posts"
ON public.threads_post_log
FOR INSERT
WITH CHECK (true);

-- Create index for querying by status and date
CREATE INDEX idx_threads_post_log_status ON public.threads_post_log(status);
CREATE INDEX idx_threads_post_log_created_at ON public.threads_post_log(created_at DESC);