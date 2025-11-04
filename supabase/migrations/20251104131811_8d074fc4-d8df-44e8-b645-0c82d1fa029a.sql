-- Create trigger function to generate static HTML when content is published
CREATE OR REPLACE FUNCTION public.trigger_static_html_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger on INSERT or UPDATE to published state
  IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true) OR
     (TG_OP = 'UPDATE' AND NEW.is_published = true AND (OLD.updated_at IS DISTINCT FROM NEW.updated_at)) THEN
    
    -- Determine content type based on table
    DECLARE
      content_type text;
    BEGIN
      IF TG_TABLE_NAME = 'blog_posts' THEN
        content_type := 'blog_post';
      ELSIF TG_TABLE_NAME = 'music_stories' THEN
        content_type := 'music_story';
      ELSIF TG_TABLE_NAME = 'platform_products' THEN
        content_type := 'product';
      ELSE
        RETURN NEW;
      END IF;
      
      -- Call edge function to generate static HTML
      PERFORM net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-static-html',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true)
        ),
        body := jsonb_build_object(
          'contentType', content_type,
          'slug', NEW.slug,
          'forceRegenerate', true
        )
      );
      
      RAISE NOTICE 'Triggered static HTML generation for % with slug: %', content_type, NEW.slug;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_static_html_blog_posts ON blog_posts;
DROP TRIGGER IF EXISTS trigger_static_html_music_stories ON music_stories;
DROP TRIGGER IF EXISTS trigger_static_html_products ON platform_products;

-- Create trigger for blog posts
CREATE TRIGGER trigger_static_html_blog_posts
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_static_html_generation();

-- Create trigger for music stories
CREATE TRIGGER trigger_static_html_music_stories
  AFTER INSERT OR UPDATE ON music_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_static_html_generation();

-- Create trigger for platform products
CREATE TRIGGER trigger_static_html_products
  AFTER INSERT OR UPDATE ON platform_products
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND NEW.published_at IS NOT NULL)
  EXECUTE FUNCTION public.trigger_static_html_generation();

-- Add index for better performance on published content queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_slug ON blog_posts(slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_music_stories_published_slug ON music_stories(slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_platform_products_active_slug ON platform_products(slug) WHERE status = 'active' AND published_at IS NOT NULL;

COMMENT ON FUNCTION public.trigger_static_html_generation() IS 'Automatically generates static HTML for SEO when content is published or updated';
