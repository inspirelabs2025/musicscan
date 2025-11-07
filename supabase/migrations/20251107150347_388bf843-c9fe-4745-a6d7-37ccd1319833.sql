-- Update trigger functions to notify all search engines including Google

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS public.trigger_indexnow_blog_post() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_indexnow_music_story() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_indexnow_product() CASCADE;

-- Create unified search engine notification function
CREATE OR REPLACE FUNCTION public.notify_search_engines_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url TEXT;
  v_content_type TEXT;
  v_should_notify BOOLEAN := FALSE;
  v_trigger_sitemap_ping BOOLEAN := FALSE;
BEGIN
  -- Determine URL path, content type, and whether to notify
  IF TG_TABLE_NAME = 'blog_posts' THEN
    IF NEW.is_published = TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published = FALSE)) THEN
      v_url := '/plaat-verhaal/' || NEW.slug;
      v_content_type := 'blog_post';
      v_should_notify := TRUE;
      v_trigger_sitemap_ping := TRUE; -- New blog posts trigger full sitemap ping
    END IF;
  ELSIF TG_TABLE_NAME = 'music_stories' THEN
    IF NEW.is_published = TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published = FALSE)) THEN
      v_url := '/muziek-verhaal/' || NEW.slug;
      v_content_type := 'music_story';
      v_should_notify := TRUE;
      v_trigger_sitemap_ping := TRUE;
    END IF;
  ELSIF TG_TABLE_NAME = 'platform_products' THEN
    IF NEW.status = 'active' AND NEW.published_at IS NOT NULL AND 
       (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.published_at IS DISTINCT FROM NEW.published_at))) THEN
      v_url := '/product/' || NEW.slug;
      v_content_type := 'product';
      v_should_notify := TRUE;
      v_trigger_sitemap_ping := TRUE;
    END IF;
  END IF;

  -- If should notify, call the edge function
  IF v_should_notify THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/notify-search-engines',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'url', v_url,
          'contentType', v_content_type,
          'triggerSitemapPing', v_trigger_sitemap_ping
        )
      );
      
      RAISE NOTICE 'Notified search engines for % (type: %)', v_url, v_content_type;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Search engine notification failed for %: %', v_url, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate triggers for all content types
CREATE TRIGGER notify_search_engines_blog_post
  AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_search_engines_on_publish();

CREATE TRIGGER notify_search_engines_music_story
  AFTER INSERT OR UPDATE ON public.music_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_search_engines_on_publish();

CREATE TRIGGER notify_search_engines_product
  AFTER INSERT OR UPDATE ON public.platform_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_search_engines_on_publish();

COMMENT ON FUNCTION public.notify_search_engines_on_publish() IS 
  'Automatically notifies search engines (Google, Bing, Yandex) when content is published via IndexNow and Google Sitemap Ping';