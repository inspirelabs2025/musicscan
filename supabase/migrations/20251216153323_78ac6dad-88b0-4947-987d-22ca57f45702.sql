-- Server-side aggregation function for clean_analytics overview
-- This fixes the 1000-row limit issue causing corrupt statistics

CREATE OR REPLACE FUNCTION get_clean_analytics_stats(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  total_hits bigint,
  real_users bigint,
  datacenter_hits bigint,
  unique_sessions bigint,
  purity_score numeric,
  quality_score numeric,
  pages_per_session numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_hits,
    COUNT(*) FILTER (WHERE NOT is_datacenter)::bigint as real_users,
    COUNT(*) FILTER (WHERE is_datacenter)::bigint as datacenter_hits,
    COUNT(DISTINCT session_id) FILTER (WHERE NOT is_datacenter)::bigint as unique_sessions,
    -- Purity calculation
    CASE WHEN COUNT(*) > 0 THEN
      LEAST(ROUND(
        (COUNT(*) FILTER (WHERE NOT is_datacenter)::numeric / COUNT(*) * 100) * 
        (COALESCE(AVG(real_user_score) FILTER (WHERE NOT is_datacenter), 0) / 100) * 
        0.97, 1
      ), 97)
    ELSE 0 END as purity_score,
    -- Quality score
    COALESCE(ROUND(AVG(real_user_score) FILTER (WHERE NOT is_datacenter)), 0) as quality_score,
    -- Pages per session
    COALESCE(ROUND(
      COUNT(*) FILTER (WHERE NOT is_datacenter)::numeric / 
      NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE NOT is_datacenter), 0), 1
    ), 0) as pages_per_session
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date;
END;
$$;

-- Hourly distribution function
CREATE OR REPLACE FUNCTION get_clean_analytics_hourly(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  hour_of_day integer,
  hit_count bigint,
  real_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM created_at)::integer as hour_of_day,
    COUNT(*)::bigint as hit_count,
    COUNT(*) FILTER (WHERE NOT is_datacenter)::bigint as real_count
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY hour_of_day;
END;
$$;

-- Traffic sources function
CREATE OR REPLACE FUNCTION get_clean_analytics_sources(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  source_name text,
  hit_count bigint,
  real_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      CASE 
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer ILIKE '%google%' THEN 'Google'
        WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb.%' THEN 'Facebook'
        WHEN referrer ILIKE '%bing%' THEN 'Bing'
        WHEN referrer ILIKE '%twitter%' OR referrer ILIKE '%t.co%' THEN 'Twitter'
        WHEN referrer ILIKE '%linkedin%' THEN 'LinkedIn'
        WHEN referrer ILIKE '%instagram%' THEN 'Instagram'
        ELSE 'Other'
      END, 'Direct'
    ) as source_name,
    COUNT(*)::bigint as hit_count,
    COUNT(*) FILTER (WHERE NOT is_datacenter)::bigint as real_count
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY source_name
  ORDER BY real_count DESC;
END;
$$;

-- Device breakdown function
CREATE OR REPLACE FUNCTION get_clean_analytics_devices(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  device_name text,
  hit_count bigint,
  real_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(device_type, 'Unknown') as device_name,
    COUNT(*)::bigint as hit_count,
    COUNT(*) FILTER (WHERE NOT is_datacenter)::bigint as real_count
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY device_type
  ORDER BY real_count DESC;
END;
$$;

-- Country breakdown function
CREATE OR REPLACE FUNCTION get_clean_analytics_countries(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  country_name text,
  hit_count bigint,
  real_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(country, 'Unknown') as country_name,
    COUNT(*)::bigint as hit_count,
    COUNT(*) FILTER (WHERE NOT is_datacenter)::bigint as real_count
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY country
  ORDER BY real_count DESC
  LIMIT 20;
END;
$$;

-- Datacenter breakdown function
CREATE OR REPLACE FUNCTION get_clean_analytics_datacenters(
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  datacenter text,
  hit_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(datacenter_name, 'Unknown') as datacenter,
    COUNT(*)::bigint as hit_count
  FROM clean_analytics
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
    AND is_datacenter = true
  GROUP BY datacenter_name
  ORDER BY hit_count DESC
  LIMIT 15;
END;
$$;