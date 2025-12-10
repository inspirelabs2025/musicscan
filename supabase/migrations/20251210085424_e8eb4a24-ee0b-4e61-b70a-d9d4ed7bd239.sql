-- Trigger function to auto-queue blog posts (albums) to render_jobs
CREATE OR REPLACE FUNCTION public.auto_queue_album_to_render_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only queue if album has cover image
  IF NEW.album_cover_url IS NOT NULL THEN
    INSERT INTO render_jobs (
      type,
      source_type,
      source_id,
      image_url,
      artist,
      title,
      payload,
      priority,
      status
    )
    VALUES (
      'gif',
      'blog_post',
      NEW.id,
      NEW.album_cover_url,
      COALESCE((NEW.yaml_frontmatter->>'artist')::text, 'Unknown Artist'),
      COALESCE((NEW.yaml_frontmatter->>'title')::text, 'Unknown Album'),
      jsonb_build_object(
        'blog_id', NEW.id,
        'slug', NEW.slug,
        'album_cover_url', NEW.album_cover_url,
        'artist', COALESCE((NEW.yaml_frontmatter->>'artist')::text, 'Unknown Artist'),
        'title', COALESCE((NEW.yaml_frontmatter->>'title')::text, 'Unknown Album')
      ),
      50,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on blog_posts table
DROP TRIGGER IF EXISTS trigger_auto_queue_album_render ON blog_posts;
CREATE TRIGGER trigger_auto_queue_album_render
  AFTER INSERT ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_album_to_render_jobs();

-- Also trigger on update when album_cover_url is added
DROP TRIGGER IF EXISTS trigger_auto_queue_album_render_update ON blog_posts;
CREATE TRIGGER trigger_auto_queue_album_render_update
  AFTER UPDATE OF album_cover_url ON blog_posts
  FOR EACH ROW
  WHEN (OLD.album_cover_url IS NULL AND NEW.album_cover_url IS NOT NULL)
  EXECUTE FUNCTION auto_queue_album_to_render_jobs();