-- Year Overview Cache Table
CREATE TABLE IF NOT EXISTS public.year_overview_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  filter_hash TEXT DEFAULT 'default',
  data_points JSONB NOT NULL DEFAULT '{}',
  generated_narratives JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours',
  UNIQUE(year, filter_hash)
);

-- Enable RLS
ALTER TABLE public.year_overview_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for cached overviews
CREATE POLICY "Anyone can view year overviews"
ON public.year_overview_cache FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage year overviews"
ON public.year_overview_cache FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_year_overview_cache_year ON public.year_overview_cache(year);
CREATE INDEX idx_year_overview_cache_expires ON public.year_overview_cache(expires_at);

-- Function: Get year statistics overview
CREATE OR REPLACE FUNCTION public.get_year_overview_stats(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  vinyl_count INTEGER;
  cd_count INTEGER;
  total_scans INTEGER;
  unique_artists INTEGER;
  avg_price NUMERIC;
  total_users INTEGER;
  total_stories INTEGER;
  total_products INTEGER;
BEGIN
  -- Vinyl scans count
  SELECT COUNT(*) INTO vinyl_count
  FROM vinyl2_scan
  WHERE EXTRACT(YEAR FROM created_at) = p_year;
  
  -- CD scans count
  SELECT COUNT(*) INTO cd_count
  FROM cd_scan
  WHERE EXTRACT(YEAR FROM created_at) = p_year;
  
  total_scans := vinyl_count + cd_count;
  
  -- Unique artists from scans
  SELECT COUNT(DISTINCT artist) INTO unique_artists
  FROM (
    SELECT artist FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND artist IS NOT NULL
    UNION
    SELECT artist FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND artist IS NOT NULL
  ) combined;
  
  -- Average median price from vinyl
  SELECT COALESCE(AVG(median_price), 0) INTO avg_price
  FROM vinyl2_scan
  WHERE EXTRACT(YEAR FROM created_at) = p_year AND median_price IS NOT NULL;
  
  -- Total users
  SELECT COUNT(*) INTO total_users
  FROM profiles
  WHERE EXTRACT(YEAR FROM created_at) = p_year;
  
  -- Total stories
  SELECT COUNT(*) INTO total_stories
  FROM music_stories
  WHERE EXTRACT(YEAR FROM created_at) = p_year AND is_published = true;
  
  -- Total products
  SELECT COUNT(*) INTO total_products
  FROM platform_products
  WHERE EXTRACT(YEAR FROM created_at) = p_year AND status = 'active';
  
  result := jsonb_build_object(
    'year', p_year,
    'total_scans', total_scans,
    'vinyl_count', vinyl_count,
    'cd_count', cd_count,
    'vinyl_percentage', CASE WHEN total_scans > 0 THEN ROUND((vinyl_count::NUMERIC / total_scans) * 100, 1) ELSE 0 END,
    'unique_artists', unique_artists,
    'avg_median_price', ROUND(avg_price, 2),
    'new_users', total_users,
    'total_stories', total_stories,
    'total_products', total_products
  );
  
  RETURN result;
END;
$$;

-- Function: Get genre distribution
CREATE OR REPLACE FUNCTION public.get_genre_distribution_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT genre, COUNT(*) as count
    FROM (
      SELECT genre FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND genre IS NOT NULL
      UNION ALL
      SELECT genre FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND genre IS NOT NULL
    ) combined
    GROUP BY genre
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  RETURN result;
END;
$$;

-- Function: Get country distribution
CREATE OR REPLACE FUNCTION public.get_country_distribution_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT country, COUNT(*) as count
    FROM (
      SELECT country FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND country IS NOT NULL
      UNION ALL
      SELECT country FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND country IS NOT NULL
    ) combined
    GROUP BY country
    ORDER BY count DESC
    LIMIT 15
  ) t;
  
  RETURN result;
END;
$$;

-- Function: Get decade distribution
CREATE OR REPLACE FUNCTION public.get_decade_distribution_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT 
      (FLOOR(year / 10) * 10)::TEXT || 's' as decade,
      COUNT(*) as count
    FROM (
      SELECT year FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND year IS NOT NULL
      UNION ALL
      SELECT year FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND year IS NOT NULL
    ) combined
    WHERE year >= 1950 AND year <= 2030
    GROUP BY FLOOR(year / 10)
    ORDER BY FLOOR(year / 10)
  ) t;
  
  RETURN result;
END;
$$;

-- Function: Get monthly trends
CREATE OR REPLACE FUNCTION public.get_monthly_trends_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT 
      EXTRACT(MONTH FROM created_at)::INTEGER as month,
      TO_CHAR(DATE_TRUNC('month', MIN(created_at)), 'Mon') as month_name,
      COUNT(*) as scans,
      COALESCE(AVG(median_price), 0)::NUMERIC(10,2) as avg_price
    FROM (
      SELECT created_at, median_price FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year
      UNION ALL
      SELECT created_at, median_price FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year
    ) combined
    GROUP BY EXTRACT(MONTH FROM created_at)
    ORDER BY month
  ) t;
  
  RETURN result;
END;
$$;

-- Function: Get top artists
CREATE OR REPLACE FUNCTION public.get_top_artists_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT artist, COUNT(*) as count, COALESCE(AVG(median_price), 0)::NUMERIC(10,2) as avg_value
    FROM (
      SELECT artist, median_price FROM vinyl2_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND artist IS NOT NULL
      UNION ALL
      SELECT artist, median_price FROM cd_scan WHERE EXTRACT(YEAR FROM created_at) = p_year AND artist IS NOT NULL
    ) combined
    GROUP BY artist
    ORDER BY count DESC
    LIMIT p_limit
  ) t;
  
  RETURN result;
END;
$$;

-- Function: Get price insights
CREATE OR REPLACE FUNCTION public.get_price_insights_by_year(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  highest_items JSONB;
  price_ranges JSONB;
BEGIN
  -- Top valued items
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO highest_items
  FROM (
    SELECT artist, title, median_price, 'vinyl' as format
    FROM vinyl2_scan
    WHERE EXTRACT(YEAR FROM created_at) = p_year AND median_price IS NOT NULL
    ORDER BY median_price DESC
    LIMIT 5
  ) t;
  
  -- Price range distribution
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO price_ranges
  FROM (
    SELECT 
      CASE 
        WHEN median_price < 10 THEN '€0-10'
        WHEN median_price < 25 THEN '€10-25'
        WHEN median_price < 50 THEN '€25-50'
        WHEN median_price < 100 THEN '€50-100'
        ELSE '€100+'
      END as price_range,
      COUNT(*) as count
    FROM vinyl2_scan
    WHERE EXTRACT(YEAR FROM created_at) = p_year AND median_price IS NOT NULL
    GROUP BY 1
    ORDER BY MIN(median_price)
  ) t;
  
  result := jsonb_build_object(
    'highest_valued', highest_items,
    'price_ranges', price_ranges
  );
  
  RETURN result;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_year_overview_cache_updated_at
BEFORE UPDATE ON public.year_overview_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();