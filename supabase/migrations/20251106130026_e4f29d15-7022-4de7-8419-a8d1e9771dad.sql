-- Fix queue_sitemap_regeneration function to avoid referencing non-existent columns
CREATE OR REPLACE FUNCTION public.queue_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_should_queue boolean := false;
BEGIN
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'music_stories' THEN 'music_story'
    WHEN 'blog_posts' THEN 'blog_post'
    WHEN 'platform_products' THEN 'art_product'
  END;

  -- Check conditions based on table type to avoid referencing non-existent columns
  IF TG_TABLE_NAME = 'platform_products' THEN
    v_should_queue := (NEW.status = 'active' AND NEW.published_at IS NOT NULL);
  ELSIF TG_TABLE_NAME IN ('music_stories', 'blog_posts') THEN
    v_should_queue := (NEW.is_published = TRUE);
  END IF;

  IF v_should_queue THEN
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