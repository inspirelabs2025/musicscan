-- Fix the trigger_auto_blog_generation function to handle ai_scan_results table properly
CREATE OR REPLACE FUNCTION public.trigger_auto_blog_generation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_auto_blog_enabled boolean := true; -- Default enabled for now
  is_scan_completed boolean := false;
BEGIN
  -- Get user's auto-blog preference (treat NULL as true for backward compatibility)
  SELECT COALESCE(auto_blog_generation, true) INTO user_auto_blog_enabled
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- Check if scan is completed based on table type
  IF TG_TABLE_NAME = 'ai_scan_results' THEN
    -- For AI scans, check if status is completed
    is_scan_completed := (NEW.status = 'completed');
  ELSE
    -- For cd_scan and vinyl2_scan, check if calculated_advice_price exists
    is_scan_completed := (
      CASE 
        WHEN TG_TABLE_NAME = 'cd_scan' THEN 
          (SELECT CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'cd_scan' AND column_name = 'calculated_advice_price'
          ) THEN 
            COALESCE((row_to_json(NEW)::jsonb ->> 'calculated_advice_price')::numeric, 0) > 0
          ELSE false END)
        WHEN TG_TABLE_NAME = 'vinyl2_scan' THEN 
          (SELECT CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vinyl2_scan' AND column_name = 'calculated_advice_price'
          ) THEN 
            COALESCE((row_to_json(NEW)::jsonb ->> 'calculated_advice_price')::numeric, 0) > 0
          ELSE false END)
        ELSE false
      END
    );
  END IF;
  
  -- Only trigger for scans with discogs_id and completion indicator
  IF NEW.discogs_id IS NOT NULL 
     AND is_scan_completed
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
            WHEN TG_TABLE_NAME = 'ai_scan_results' THEN 'ai'
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