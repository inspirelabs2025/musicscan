-- Sitemap Regeneration Logging & Queue Tables
CREATE TABLE IF NOT EXISTS public.sitemap_regeneration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source text NOT NULL,
  content_id uuid,
  content_slug text,
  content_type text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  status text DEFAULT 'pending',
  sitemaps_updated text[],
  gsc_submitted boolean DEFAULT false,
  gsc_response jsonb,
  health_checks jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sitemap_log_status ON sitemap_regeneration_log(status);
CREATE INDEX idx_sitemap_log_trigger ON sitemap_regeneration_log(trigger_source);
CREATE INDEX idx_sitemap_log_created ON sitemap_regeneration_log(created_at DESC);

CREATE TABLE IF NOT EXISTS public.sitemap_regeneration_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  content_slug text,
  queued_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  status text DEFAULT 'pending',
  UNIQUE(content_type, content_id)
);

CREATE INDEX idx_sitemap_queue_pending ON sitemap_regeneration_queue(status, queued_at) 
  WHERE status = 'pending';

-- Trigger function that queues sitemap regenerations
CREATE OR REPLACE FUNCTION public.queue_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_content_type text;
BEGIN
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'music_stories' THEN 'music_story'
    WHEN 'blog_posts' THEN 'blog_post'
    WHEN 'platform_products' THEN 'art_product'
  END;

  IF (TG_TABLE_NAME = 'platform_products' AND NEW.status = 'active' AND NEW.published_at IS NOT NULL) OR
     (TG_TABLE_NAME IN ('music_stories', 'blog_posts') AND NEW.is_published = TRUE) THEN
    
    INSERT INTO public.sitemap_regeneration_queue (content_type, content_id, content_slug, status)
    VALUES (v_content_type, NEW.id, NEW.slug, 'pending')
    ON CONFLICT (content_type, content_id) 
    DO UPDATE SET 
      queued_at = now(),
      status = 'pending',
      processed_at = NULL;
    
    RAISE NOTICE 'Queued sitemap regeneration for % (slug: %)', v_content_type, NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach triggers to all content tables
DROP TRIGGER IF EXISTS trigger_queue_sitemap_music_stories ON music_stories;
CREATE TRIGGER trigger_queue_sitemap_music_stories
  AFTER INSERT OR UPDATE ON music_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_sitemap_regeneration();

DROP TRIGGER IF EXISTS trigger_queue_sitemap_blog_posts ON blog_posts;
CREATE TRIGGER trigger_queue_sitemap_blog_posts
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_sitemap_regeneration();

DROP TRIGGER IF EXISTS trigger_queue_sitemap_products ON platform_products;
CREATE TRIGGER trigger_queue_sitemap_products
  AFTER INSERT OR UPDATE ON platform_products
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_sitemap_regeneration();