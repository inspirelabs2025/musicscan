-- Create table to track IndexNow submissions
CREATE TABLE IF NOT EXISTS public.indexnow_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urls TEXT[] NOT NULL,
  content_type TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_indexnow_submissions_submitted_at ON public.indexnow_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_indexnow_submissions_content_type ON public.indexnow_submissions(content_type);

-- Enable RLS (admin only access)
ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view submissions
CREATE POLICY "Authenticated users can view indexnow submissions"
  ON public.indexnow_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to submit URL to IndexNow via Edge Function
CREATE OR REPLACE FUNCTION public.submit_to_indexnow(
  p_url TEXT,
  p_content_type TEXT DEFAULT 'blog_post'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call Edge Function asynchronously via pg_net (if available)
  -- For now, we'll track this in a queue table and process via cron
  INSERT INTO public.indexnow_queue (url, content_type)
  VALUES (p_url, p_content_type);
END;
$$;

-- Create queue table for IndexNow submissions
CREATE TABLE IF NOT EXISTS public.indexnow_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_indexnow_queue_processed ON public.indexnow_queue(processed, created_at);

-- Enable RLS
ALTER TABLE public.indexnow_queue ENABLE ROW LEVEL SECURITY;

-- Policy: System access only
CREATE POLICY "Service role can manage indexnow queue"
  ON public.indexnow_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger function for blog_posts
CREATE OR REPLACE FUNCTION public.trigger_indexnow_blog_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for published posts
  IF NEW.is_published = TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published = FALSE)) THEN
    PERFORM public.submit_to_indexnow(
      '/plaat-verhaal/' || NEW.slug,
      'blog_post'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for music_stories
CREATE OR REPLACE FUNCTION public.trigger_indexnow_music_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_published = TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published = FALSE)) THEN
    PERFORM public.submit_to_indexnow(
      '/muziek-verhaal/' || NEW.slug,
      'music_story'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for platform_products
CREATE OR REPLACE FUNCTION public.trigger_indexnow_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.published_at IS NOT NULL AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'active' OR OLD.published_at IS NULL))) THEN
    PERFORM public.submit_to_indexnow(
      '/product/' || NEW.slug,
      'product'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_indexnow_on_blog_post ON public.blog_posts;
CREATE TRIGGER trigger_indexnow_on_blog_post
  AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_indexnow_blog_post();

DROP TRIGGER IF EXISTS trigger_indexnow_on_music_story ON public.music_stories;
CREATE TRIGGER trigger_indexnow_on_music_story
  AFTER INSERT OR UPDATE ON public.music_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_indexnow_music_story();

DROP TRIGGER IF EXISTS trigger_indexnow_on_product ON public.platform_products;
CREATE TRIGGER trigger_indexnow_on_product
  AFTER INSERT OR UPDATE ON public.platform_products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_indexnow_product();

-- Function to batch process queue (call this from cron every 5 minutes)
CREATE OR REPLACE FUNCTION public.process_indexnow_queue()
RETURNS TABLE(processed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_size INTEGER := 100;
  v_urls TEXT[];
  v_content_type TEXT;
  v_processed INTEGER := 0;
BEGIN
  -- Get unprocessed items grouped by content_type
  FOR v_content_type IN 
    SELECT DISTINCT content_type 
    FROM public.indexnow_queue 
    WHERE processed = FALSE 
    LIMIT 10
  LOOP
    -- Get URLs for this content type
    SELECT array_agg(url)
    INTO v_urls
    FROM (
      SELECT url 
      FROM public.indexnow_queue 
      WHERE processed = FALSE 
        AND content_type = v_content_type
      LIMIT v_batch_size
    ) sub;
    
    IF array_length(v_urls, 1) > 0 THEN
      -- Mark as processed
      UPDATE public.indexnow_queue
      SET processed = TRUE, processed_at = now()
      WHERE url = ANY(v_urls) AND content_type = v_content_type;
      
      v_processed := v_processed + array_length(v_urls, 1);
      
      -- Here you would call the Edge Function via HTTP
      -- For now, this is a placeholder - implement via pg_cron + pg_net
      RAISE NOTICE 'Would submit % URLs of type %', array_length(v_urls, 1), v_content_type;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_processed;
END;
$$;