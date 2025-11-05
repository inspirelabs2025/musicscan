-- Fix trigger_static_html_generation to handle different table schemas
CREATE OR REPLACE FUNCTION public.trigger_static_html_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Determine if we should trigger based on table
  DECLARE
    should_trigger BOOLEAN := false;
    content_type text;
  BEGIN
    -- Check conditions based on table
    IF TG_TABLE_NAME = 'blog_posts' THEN
      should_trigger := (TG_OP = 'INSERT' AND NEW.is_published = true) OR 
                       (TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true) OR
                       (TG_OP = 'UPDATE' AND NEW.is_published = true AND (OLD.updated_at IS DISTINCT FROM NEW.updated_at));
      content_type := 'blog_post';
    ELSIF TG_TABLE_NAME = 'music_stories' THEN
      should_trigger := (TG_OP = 'INSERT' AND NEW.is_published = true) OR 
                       (TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true) OR
                       (TG_OP = 'UPDATE' AND NEW.is_published = true AND (OLD.updated_at IS DISTINCT FROM NEW.updated_at));
      content_type := 'music_story';
    ELSIF TG_TABLE_NAME = 'platform_products' THEN
      should_trigger := (TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.published_at IS NOT NULL) OR 
                       (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.published_at IS DISTINCT FROM NEW.published_at) 
                        AND NEW.status = 'active' AND NEW.published_at IS NOT NULL) OR
                       (TG_OP = 'UPDATE' AND NEW.status = 'active' AND NEW.published_at IS NOT NULL AND (OLD.updated_at IS DISTINCT FROM NEW.updated_at));
      content_type := 'product';
    ELSE
      RETURN NEW;
    END IF;
    
    IF should_trigger THEN
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
    END IF;
  END;
  
  RETURN NEW;
END;
$function$;