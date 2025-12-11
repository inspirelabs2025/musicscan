-- Fix SECURITY DEFINER views by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.clean_analytics_summary;
DROP VIEW IF EXISTS public.clean_analytics_by_country;

-- Recreate aggregated view with SECURITY INVOKER
CREATE VIEW public.clean_analytics_summary 
WITH (security_invoker = true) AS
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

-- Recreate country breakdown view with SECURITY INVOKER
CREATE VIEW public.clean_analytics_by_country 
WITH (security_invoker = true) AS
SELECT 
  COALESCE(real_country, country) as display_country,
  COUNT(*) as hit_count,
  AVG(real_user_score) as avg_score,
  COUNT(*) FILTER (WHERE is_datacenter = false) as real_hits
FROM public.clean_analytics
WHERE is_datacenter = false
GROUP BY COALESCE(real_country, country)
ORDER BY hit_count DESC;