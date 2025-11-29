-- Create function to auto-post blog to Facebook when published
CREATE OR REPLACE FUNCTION public.auto_post_blog_to_facebook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  blog_title TEXT;
  blog_summary TEXT;
  blog_url TEXT;
  blog_image TEXT;
BEGIN
  -- Only trigger when blog is newly published
  IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true) THEN
    
    -- Extract title and summary from yaml_frontmatter
    blog_title := COALESCE(NEW.yaml_frontmatter->>'title', 'Nieuw Blog Artikel');
    blog_summary := COALESCE(
      NEW.yaml_frontmatter->>'description',
      NEW.yaml_frontmatter->>'summary',
      LEFT(NEW.markdown_content, 200) || '...'
    );
    blog_url := 'https://www.musicscan.app/blog/' || NEW.slug;
    blog_image := COALESCE(NEW.album_cover_url, NEW.yaml_frontmatter->>'cover_image');
    
    -- Call the post-to-facebook edge function
    BEGIN
      PERFORM net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-to-facebook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'content_type', 'blog_post',
          'title', blog_title,
          'content', blog_summary,
          'url', blog_url,
          'image_url', blog_image,
          'hashtags', ARRAY['MusicScan', 'MuziekBlog', 'Vinyl', 'Muziek']
        )
      );
      
      RAISE NOTICE 'Auto-posted blog to Facebook: %', blog_title;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to auto-post blog to Facebook: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auto-posting blogs to Facebook
DROP TRIGGER IF EXISTS trigger_auto_post_blog_to_facebook ON public.blog_posts;

CREATE TRIGGER trigger_auto_post_blog_to_facebook
  AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_post_blog_to_facebook();