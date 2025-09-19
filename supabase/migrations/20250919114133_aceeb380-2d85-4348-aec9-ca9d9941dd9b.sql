-- Create function to handle automatic blog generation
CREATE OR REPLACE FUNCTION public.trigger_auto_blog_generation()
RETURNS TRIGGER AS $$
DECLARE
  user_auto_blog_enabled boolean := true; -- Default enabled for now
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all scan tables
CREATE TRIGGER auto_blog_generation_trigger_ai
  AFTER INSERT OR UPDATE ON public.ai_scan_results
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_blog_generation();

CREATE TRIGGER auto_blog_generation_trigger_cd
  AFTER INSERT OR UPDATE ON public.cd_scan
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_blog_generation();

CREATE TRIGGER auto_blog_generation_trigger_vinyl
  AFTER INSERT OR UPDATE ON public.vinyl2_scan
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_blog_generation();

-- Add user preference for auto blog generation (to profiles table or create settings table)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auto_blog_generation boolean DEFAULT true;