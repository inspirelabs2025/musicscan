-- Fix the trigger_auto_blog_generation function to work with cd_scan and vinyl2_scan tables
-- These tables don't have a status field, so we need to adjust the logic

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
  
  -- Only trigger for scans with discogs_id and calculated_advice_price (indicating completion)
  -- Note: cd_scan and vinyl2_scan tables don't have a status field, so we check for completion differently
  IF NEW.discogs_id IS NOT NULL 
     AND NEW.calculated_advice_price IS NOT NULL
     AND user_auto_blog_enabled THEN
    
    -- Safely call the auto-blog-trigger edge function without relying on request.jwt.claims
    -- Wrap in exception block so any HTTP errors won't fail the original DML
    BEGIN
      PERFORM net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/auto-blog-trigger',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
          -- No Authorization header to avoid request.jwt.claims dependency
        ),
        body := jsonb_build_object(
          'scan_id', NEW.id,
          'album_id', NEW.id,
          'media_type', CASE 
            WHEN TG_TABLE_NAME = 'cd_scan' THEN 'cd'
            WHEN TG_TABLE_NAME = 'vinyl2_scan' THEN 'vinyl'
            ELSE 'unknown'
          END,
          'user_id', NEW.user_id,
          'auto_generated', true
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but do not interrupt the main transaction
      RAISE NOTICE 'auto-blog-trigger call failed for scan %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;