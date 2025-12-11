-- Create clean_analytics table for tracking real vs datacenter traffic
CREATE TABLE public.clean_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT,
  user_agent TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  is_datacenter BOOLEAN NOT NULL DEFAULT false,
  datacenter_name TEXT,
  real_country TEXT,
  real_user_score INTEGER NOT NULL DEFAULT 50,
  device_type TEXT,
  browser TEXT,
  referrer TEXT,
  path TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_clean_analytics_created_at ON public.clean_analytics(created_at DESC);
CREATE INDEX idx_clean_analytics_is_datacenter ON public.clean_analytics(is_datacenter);
CREATE INDEX idx_clean_analytics_country ON public.clean_analytics(country);
CREATE INDEX idx_clean_analytics_path ON public.clean_analytics(path);

-- Enable RLS
ALTER TABLE public.clean_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can view all analytics
CREATE POLICY "Admins can view clean analytics"
ON public.clean_analytics FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert analytics (public endpoint)
CREATE POLICY "System can insert clean analytics"
ON public.clean_analytics FOR INSERT
WITH CHECK (true);

-- Create aggregated view for dashboard
CREATE OR REPLACE VIEW public.clean_analytics_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_hits,
  COUNT(*) FILTER (WHERE is_datacenter = false) as real_users,
  COUNT(*) FILTER (WHERE is_datacenter = true) as datacenter_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_datacenter = false) / NULLIF(COUNT(*), 0), 1) as purity_score,
  AVG(real_user_score) FILTER (WHERE is_datacenter = false) as avg_real_score
FROM public.clean_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create country breakdown view (real users only)
CREATE OR REPLACE VIEW public.clean_analytics_by_country AS
SELECT 
  COALESCE(real_country, country) as display_country,
  COUNT(*) as hit_count,
  AVG(real_user_score) as avg_score,
  COUNT(*) FILTER (WHERE is_datacenter = false) as real_hits
FROM public.clean_analytics
WHERE is_datacenter = false
GROUP BY COALESCE(real_country, country)
ORDER BY hit_count DESC;