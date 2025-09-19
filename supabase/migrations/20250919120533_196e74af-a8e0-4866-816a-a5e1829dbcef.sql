-- Fix auto_blog_generation NULL values for existing users
UPDATE profiles 
SET auto_blog_generation = true 
WHERE auto_blog_generation IS NULL;

-- Update the trigger function to treat NULL as true for backward compatibility
CREATE OR REPLACE FUNCTION public.trigger_auto_blog_generation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_auto_blog_enabled boolean := true; -- Default enabled for now
BEGIN
  -- Get user's auto-blog preference (treat NULL as true for backward compatibility)
  SELECT COALESCE(auto_blog_generation, true) INTO user_auto_blog_enabled
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- Only trigger for completed scans with discogs_id and sufficient confidence
  IF NEW.status = 'completed' 
     AND NEW.discogs_id IS NOT NULL 
     AND (NEW.confidence_score IS NULL OR NEW.confidence_score > 0.7)
     AND user_auto_blog_enabled THEN
    
    -- Call the auto-blog-trigger edge function asynchronously
    PERFORM net.http_post(
      url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/auto-blog-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
      ),
      body := jsonb_build_object(
        'scan_id', NEW.id,
        'album_id', NEW.id,
        'media_type', CASE 
          WHEN TG_TABLE_NAME = 'cd_scan' THEN 'cd'
          WHEN TG_TABLE_NAME = 'vinyl2_scan' THEN 'vinyl'
          ELSE NEW.media_type
        END,
        'user_id', NEW.user_id,
        'auto_generated', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Publish the existing Tammy Wynette blog
UPDATE blog_posts 
SET 
  is_published = true,
  published_at = now()
WHERE id = '7f5fad6e-b86b-48dd-9cf4-ef717d075564';