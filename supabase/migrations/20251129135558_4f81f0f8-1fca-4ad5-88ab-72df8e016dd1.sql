-- Create function to auto-post news to Facebook when created
CREATE OR REPLACE FUNCTION public.auto_post_news_to_facebook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  news_url TEXT;
  hashtags_array TEXT[];
BEGIN
  -- Build the news URL
  news_url := 'https://www.musicscan.app/nieuws/' || NEW.slug;
  
  -- Build hashtags based on category
  hashtags_array := ARRAY['MusicScan', 'MuziekNieuws', 'Muziek'];
  IF NEW.category IS NOT NULL THEN
    hashtags_array := hashtags_array || ARRAY[REPLACE(NEW.category, ' ', '')];
  END IF;
  
  -- Call the post-to-facebook edge function
  BEGIN
    PERFORM net.http_post(
      url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-to-facebook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'content_type', 'news',
        'title', NEW.title,
        'content', NEW.summary,
        'url', news_url,
        'image_url', NEW.image_url,
        'hashtags', hashtags_array
      )
    );
    
    RAISE NOTICE 'Auto-posted news to Facebook: %', NEW.title;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to auto-post news to Facebook: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auto-posting news to Facebook
DROP TRIGGER IF EXISTS trigger_auto_post_news_to_facebook ON public.news_blog_posts;

CREATE TRIGGER trigger_auto_post_news_to_facebook
  AFTER INSERT ON public.news_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_post_news_to_facebook();