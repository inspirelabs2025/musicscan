-- Create excluded analytics users table
CREATE TABLE public.excluded_analytics_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.excluded_analytics_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit
CREATE POLICY "Admins can manage excluded users" ON public.excluded_analytics_users
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert the admin user to exclude
INSERT INTO public.excluded_analytics_users (user_id, email, reason)
VALUES ('567d3376-a797-447c-86cb-4c2f1260e997', 'rogiervisser76@gmail.com', 'admin');

-- Create function to get pageview stats excluding admins
CREATE OR REPLACE FUNCTION public.get_filtered_pageview_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  path text,
  page_title text,
  view_count bigint,
  unique_sessions bigint,
  from_facebook bigint,
  from_google bigint,
  from_direct bigint
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
    COUNT(DISTINCT pv.session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE pv.referrer ILIKE '%facebook%') as from_facebook,
    COUNT(*) FILTER (WHERE pv.referrer ILIKE '%google%') as from_google,
    COUNT(*) FILTER (WHERE pv.referrer IS NULL OR pv.referrer = '') as from_direct
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY pv.path
  ORDER BY view_count DESC;
END;
$$;

-- Create function for traffic sources breakdown
CREATE OR REPLACE FUNCTION public.get_traffic_sources_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  source_name text,
  view_count bigint,
  unique_sessions bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_views bigint;
BEGIN
  -- Get total excluding admins
  SELECT COUNT(*) INTO total_views
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL));

  RETURN QUERY
  SELECT 
    CASE 
      WHEN pv.referrer ILIKE '%facebook%' THEN 'Facebook'
      WHEN pv.referrer ILIKE '%google%' THEN 'Google'
      WHEN pv.referrer ILIKE '%twitter%' OR pv.referrer ILIKE '%x.com%' THEN 'Twitter/X'
      WHEN pv.referrer ILIKE '%linkedin%' THEN 'LinkedIn'
      WHEN pv.referrer IS NULL OR pv.referrer = '' THEN 'Direct'
      ELSE 'Overig'
    END as source_name,
    COUNT(*) as view_count,
    COUNT(DISTINCT pv.session_id) as unique_sessions,
    ROUND((COUNT(*)::numeric / NULLIF(total_views, 0)::numeric) * 100, 1) as percentage
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY source_name
  ORDER BY view_count DESC;
END;
$$;

-- Create function for hourly traffic distribution
CREATE OR REPLACE FUNCTION public.get_hourly_traffic(p_days integer DEFAULT 7)
RETURNS TABLE(
  hour_of_day integer,
  view_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM pv.created_at)::integer as hour_of_day,
    COUNT(*) as view_count
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
END;
$$;

-- Create function for content category stats
CREATE OR REPLACE FUNCTION public.get_content_category_stats(p_days integer DEFAULT 7)
RETURNS TABLE(
  category text,
  view_count bigint,
  unique_sessions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pv.path = '/' THEN 'Homepage'
      WHEN pv.path LIKE '/muziek-verhaal%' OR pv.path LIKE '/plaat-verhaal%' THEN 'Album Stories'
      WHEN pv.path LIKE '/singles%' THEN 'Singles'
      WHEN pv.path LIKE '/artists%' THEN 'Artiesten'
      WHEN pv.path LIKE '/nieuws%' THEN 'Nieuws'
      WHEN pv.path LIKE '/quiz%' THEN 'Quizzen'
      WHEN pv.path LIKE '/product%' OR pv.path LIKE '/shop%' THEN 'Shop'
      WHEN pv.path LIKE '/anekdotes%' THEN 'Anekdotes'
      WHEN pv.path LIKE '/nederland%' THEN 'Nederland'
      WHEN pv.path LIKE '/frankrijk%' THEN 'Frankrijk'
      WHEN pv.path LIKE '/dance%' THEN 'Dance/House'
      WHEN pv.path LIKE '/new-release%' OR pv.path LIKE '/releases%' THEN 'New Releases'
      ELSE 'Overig'
    END as category,
    COUNT(*) as view_count,
    COUNT(DISTINCT pv.session_id) as unique_sessions
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY category
  ORDER BY view_count DESC;
END;
$$;

-- Create function for daily traffic trend
CREATE OR REPLACE FUNCTION public.get_daily_traffic_trend(p_days integer DEFAULT 30)
RETURNS TABLE(
  date date,
  total_views bigint,
  unique_sessions bigint,
  from_facebook bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pv.created_at) as date,
    COUNT(*) as total_views,
    COUNT(DISTINCT pv.session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE pv.referrer ILIKE '%facebook%') as from_facebook
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY DATE(pv.created_at)
  ORDER BY date;
END;
$$;

-- Create function for device breakdown (based on user_agent)
CREATE OR REPLACE FUNCTION public.get_device_breakdown(p_days integer DEFAULT 7)
RETURNS TABLE(
  device_type text,
  view_count bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_views bigint;
BEGIN
  SELECT COUNT(*) INTO total_views
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL));

  RETURN QUERY
  SELECT 
    CASE 
      WHEN pv.user_agent ILIKE '%mobile%' OR pv.user_agent ILIKE '%android%' OR pv.user_agent ILIKE '%iphone%' THEN 'Mobile'
      WHEN pv.user_agent ILIKE '%tablet%' OR pv.user_agent ILIKE '%ipad%' THEN 'Tablet'
      ELSE 'Desktop'
    END as device_type,
    COUNT(*) as view_count,
    ROUND((COUNT(*)::numeric / NULLIF(total_views, 0)::numeric) * 100, 1) as percentage
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval
    AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))
  GROUP BY device_type
  ORDER BY view_count DESC;
END;
$$;

-- Create function for analytics overview
CREATE OR REPLACE FUNCTION public.get_analytics_overview(p_days integer DEFAULT 7)
RETURNS TABLE(
  total_views bigint,
  unique_sessions bigint,
  admin_views bigint,
  facebook_views bigint,
  google_views bigint,
  direct_views bigint,
  avg_views_per_day numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL)) as total_views,
    COUNT(DISTINCT pv.session_id) FILTER (WHERE pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL)) as unique_sessions,
    COUNT(*) FILTER (WHERE pv.user_id IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL)) as admin_views,
    COUNT(*) FILTER (WHERE pv.referrer ILIKE '%facebook%' AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))) as facebook_views,
    COUNT(*) FILTER (WHERE pv.referrer ILIKE '%google%' AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))) as google_views,
    COUNT(*) FILTER (WHERE (pv.referrer IS NULL OR pv.referrer = '') AND (pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))) as direct_views,
    ROUND(COUNT(*) FILTER (WHERE pv.user_id IS NULL OR pv.user_id NOT IN (SELECT eau.user_id FROM public.excluded_analytics_users eau WHERE eau.user_id IS NOT NULL))::numeric / p_days, 1) as avg_views_per_day
  FROM public.pageviews pv
  WHERE pv.created_at >= now() - (p_days || ' days')::interval;
END;
$$;