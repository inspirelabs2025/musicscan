-- Create pageviews table for internal analytics
CREATE TABLE public.pageviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_pageviews_path ON public.pageviews(path);
CREATE INDEX idx_pageviews_created_at ON public.pageviews(created_at DESC);
CREATE INDEX idx_pageviews_session_id ON public.pageviews(session_id);

-- Enable RLS
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Anyone can insert pageviews"
ON public.pageviews
FOR INSERT
WITH CHECK (true);

-- Only admins can read pageviews
CREATE POLICY "Admins can read pageviews"
ON public.pageviews
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create function to get pageview stats
CREATE OR REPLACE FUNCTION public.get_pageview_stats(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  path TEXT,
  page_title TEXT,
  view_count BIGINT,
  unique_sessions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.path,
    MAX(pv.page_title) as page_title,
    COUNT(*) as view_count,
    COUNT(DISTINCT pv.session_id) as unique_sessions
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
  GROUP BY pv.path
  ORDER BY view_count DESC;
END;
$$;