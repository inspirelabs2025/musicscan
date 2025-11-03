-- Track price changes and trigger blog post updates
CREATE TABLE IF NOT EXISTS public.price_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('cd', 'vinyl', 'ai')),
  old_price NUMERIC,
  new_price NUMERIC,
  price_change_percent NUMERIC,
  discogs_id INTEGER,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blog_post_updated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_change_log_scan ON public.price_change_log(scan_id, scan_type);
CREATE INDEX IF NOT EXISTS idx_price_change_log_discogs ON public.price_change_log(discogs_id);
CREATE INDEX IF NOT EXISTS idx_price_change_log_changed_at ON public.price_change_log(changed_at DESC);

-- Enable RLS
ALTER TABLE public.price_change_log ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view price changes
CREATE POLICY "Authenticated users can view price changes"
  ON public.price_change_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to log price changes for CD scans
CREATE OR REPLACE FUNCTION public.log_cd_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  price_diff NUMERIC;
  price_change_pct NUMERIC;
BEGIN
  -- Only log if price actually changed
  IF OLD.calculated_advice_price IS DISTINCT FROM NEW.calculated_advice_price AND 
     NEW.calculated_advice_price IS NOT NULL THEN
    
    price_diff := NEW.calculated_advice_price - COALESCE(OLD.calculated_advice_price, 0);
    
    IF OLD.calculated_advice_price IS NOT NULL AND OLD.calculated_advice_price > 0 THEN
      price_change_pct := (price_diff / OLD.calculated_advice_price) * 100;
    ELSE
      price_change_pct := 100; -- New price, 100% change
    END IF;
    
    INSERT INTO public.price_change_log (
      scan_id,
      scan_type,
      old_price,
      new_price,
      price_change_percent,
      discogs_id
    ) VALUES (
      NEW.id,
      'cd',
      OLD.calculated_advice_price,
      NEW.calculated_advice_price,
      price_change_pct,
      NEW.discogs_id
    );
    
    -- Update corresponding blog post's last_price_update if exists
    IF NEW.discogs_id IS NOT NULL THEN
      UPDATE public.blog_posts
      SET 
        yaml_frontmatter = jsonb_set(
          COALESCE(yaml_frontmatter, '{}'::jsonb),
          '{last_price_update}',
          to_jsonb(now()::text)
        ),
        updated_at = now()
      WHERE yaml_frontmatter->>'discogs_id' = NEW.discogs_id::text
        AND is_published = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log price changes for Vinyl scans
CREATE OR REPLACE FUNCTION public.log_vinyl_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  price_diff NUMERIC;
  price_change_pct NUMERIC;
BEGIN
  IF OLD.calculated_advice_price IS DISTINCT FROM NEW.calculated_advice_price AND 
     NEW.calculated_advice_price IS NOT NULL THEN
    
    price_diff := NEW.calculated_advice_price - COALESCE(OLD.calculated_advice_price, 0);
    
    IF OLD.calculated_advice_price IS NOT NULL AND OLD.calculated_advice_price > 0 THEN
      price_change_pct := (price_diff / OLD.calculated_advice_price) * 100;
    ELSE
      price_change_pct := 100;
    END IF;
    
    INSERT INTO public.price_change_log (
      scan_id,
      scan_type,
      old_price,
      new_price,
      price_change_percent,
      discogs_id
    ) VALUES (
      NEW.id,
      'vinyl',
      OLD.calculated_advice_price,
      NEW.calculated_advice_price,
      price_change_pct,
      NEW.discogs_id
    );
    
    IF NEW.discogs_id IS NOT NULL THEN
      UPDATE public.blog_posts
      SET 
        yaml_frontmatter = jsonb_set(
          COALESCE(yaml_frontmatter, '{}'::jsonb),
          '{last_price_update}',
          to_jsonb(now()::text)
        ),
        updated_at = now()
      WHERE yaml_frontmatter->>'discogs_id' = NEW.discogs_id::text
        AND is_published = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for price tracking
DROP TRIGGER IF EXISTS trigger_cd_price_change ON public.cd_scan;
CREATE TRIGGER trigger_cd_price_change
  AFTER UPDATE ON public.cd_scan
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cd_price_change();

DROP TRIGGER IF EXISTS trigger_vinyl_price_change ON public.vinyl2_scan;
CREATE TRIGGER trigger_vinyl_price_change
  AFTER UPDATE ON public.vinyl2_scan
  FOR EACH ROW
  EXECUTE FUNCTION public.log_vinyl_price_change();

-- Function to get price trend for an album
CREATE OR REPLACE FUNCTION public.get_price_trend(p_discogs_id INTEGER)
RETURNS TABLE(
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  price_changes INTEGER,
  trend_direction TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recent_change NUMERIC;
BEGIN
  -- Get recent price change percentage
  SELECT price_change_percent INTO v_recent_change
  FROM public.price_change_log
  WHERE discogs_id = p_discogs_id
  ORDER BY changed_at DESC
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    AVG(new_price) as avg_price,
    MIN(new_price) as min_price,
    MAX(new_price) as max_price,
    COUNT(*)::INTEGER as price_changes,
    CASE 
      WHEN v_recent_change > 5 THEN 'up'
      WHEN v_recent_change < -5 THEN 'down'
      ELSE 'stable'
    END as trend_direction
  FROM public.price_change_log
  WHERE discogs_id = p_discogs_id
    AND changed_at > now() - interval '30 days';
END;
$$;