-- Update the queue_sitemap_regeneration function to include new content types
CREATE OR REPLACE FUNCTION public.queue_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_content_type text;
  v_should_queue boolean := false;
  v_slug text;
BEGIN
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'music_stories' THEN 'music_story'
    WHEN 'blog_posts' THEN 'blog_post'
    WHEN 'platform_products' THEN 'art_product'
    WHEN 'time_machine_events' THEN 'time_machine_event'
    WHEN 'artist_fanwalls' THEN 'artist_fanwall'
    WHEN 'photos' THEN 'photo'
    WHEN 'music_anecdotes' THEN 'anecdote'
  END;

  -- Get slug based on table
  v_slug := CASE TG_TABLE_NAME
    WHEN 'photos' THEN NEW.seo_slug
    ELSE NEW.slug
  END;

  -- Check conditions based on table type
  IF TG_TABLE_NAME = 'platform_products' THEN
    v_should_queue := (NEW.status = 'active' AND NEW.published_at IS NOT NULL);
  ELSIF TG_TABLE_NAME = 'photos' THEN
    v_should_queue := (NEW.status = 'published' AND NEW.seo_slug IS NOT NULL);
  ELSIF TG_TABLE_NAME = 'time_machine_events' THEN
    v_should_queue := (NEW.is_published = TRUE);
  ELSIF TG_TABLE_NAME = 'artist_fanwalls' THEN
    v_should_queue := (NEW.is_active = TRUE);
  ELSIF TG_TABLE_NAME = 'music_anecdotes' THEN
    v_should_queue := (NEW.is_active = TRUE);
  ELSIF TG_TABLE_NAME IN ('music_stories', 'blog_posts') THEN
    v_should_queue := (NEW.is_published = TRUE);
  END IF;

  IF v_should_queue AND v_slug IS NOT NULL THEN
    INSERT INTO public.sitemap_regeneration_queue (content_type, content_id, content_slug, status)
    VALUES (v_content_type, NEW.id, v_slug, 'pending')
    ON CONFLICT (content_type, content_id) 
    DO UPDATE SET 
      queued_at = now(),
      status = 'pending',
      processed_at = NULL;
    
    -- Also add to IndexNow queue for faster indexing
    INSERT INTO public.indexnow_queue (url, content_type, processed)
    VALUES (
      CASE TG_TABLE_NAME
        WHEN 'time_machine_events' THEN '/time-machine/' || v_slug
        WHEN 'artist_fanwalls' THEN '/fanwall/' || v_slug
        WHEN 'photos' THEN '/photo/' || v_slug
        WHEN 'music_anecdotes' THEN '/anekdotes/' || v_slug
        WHEN 'blog_posts' THEN '/plaat-verhaal/' || v_slug
        WHEN 'music_stories' THEN '/muziek-verhaal/' || v_slug
        WHEN 'platform_products' THEN '/product/' || v_slug
      END,
      v_content_type,
      false
    )
    ON CONFLICT (url) DO UPDATE SET 
      processed = false,
      created_at = now();
    
    RAISE NOTICE 'Queued sitemap + IndexNow for % (slug: %)', v_content_type, v_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for new content types
DROP TRIGGER IF EXISTS trigger_queue_sitemap_time_machine ON time_machine_events;
CREATE TRIGGER trigger_queue_sitemap_time_machine
  AFTER INSERT OR UPDATE ON time_machine_events
  FOR EACH ROW
  EXECUTE FUNCTION queue_sitemap_regeneration();

DROP TRIGGER IF EXISTS trigger_queue_sitemap_fanwalls ON artist_fanwalls;
CREATE TRIGGER trigger_queue_sitemap_fanwalls
  AFTER INSERT OR UPDATE ON artist_fanwalls
  FOR EACH ROW
  EXECUTE FUNCTION queue_sitemap_regeneration();

DROP TRIGGER IF EXISTS trigger_queue_sitemap_photos ON photos;
CREATE TRIGGER trigger_queue_sitemap_photos
  AFTER INSERT OR UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION queue_sitemap_regeneration();

DROP TRIGGER IF EXISTS trigger_queue_sitemap_anecdotes ON music_anecdotes;
CREATE TRIGGER trigger_queue_sitemap_anecdotes
  AFTER INSERT OR UPDATE ON music_anecdotes
  FOR EACH ROW
  EXECUTE FUNCTION queue_sitemap_regeneration();