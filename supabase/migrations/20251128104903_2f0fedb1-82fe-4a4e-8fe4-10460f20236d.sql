-- Recreate the queue_sitemap_regeneration function to ensure it correctly handles photos.seo_slug
CREATE OR REPLACE FUNCTION public.queue_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Get slug based on table - photos uses seo_slug, others use slug
  IF TG_TABLE_NAME = 'photos' THEN
    v_slug := NEW.seo_slug;
  ELSE
    v_slug := NEW.slug;
  END IF;

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