-- Fix search_path for new IndexNow functions
CREATE OR REPLACE FUNCTION public.submit_to_indexnow(
  p_url TEXT,
  p_content_type TEXT DEFAULT 'blog_post'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.indexnow_queue (url, content_type)
  VALUES (p_url, p_content_type);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_indexnow_blog_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_published = TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published = FALSE)) THEN
    PERFORM public.submit_to_indexnow(
      '/plaat-verhaal/' || NEW.slug,
      'blog_post'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_indexnow_music_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.trigger_indexnow_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.process_indexnow_queue()
RETURNS TABLE(processed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_batch_size INTEGER := 100;
  v_urls TEXT[];
  v_content_type TEXT;
  v_processed INTEGER := 0;
BEGIN
  FOR v_content_type IN 
    SELECT DISTINCT content_type 
    FROM public.indexnow_queue 
    WHERE processed = FALSE 
    LIMIT 10
  LOOP
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
      UPDATE public.indexnow_queue
      SET processed = TRUE, processed_at = now()
      WHERE url = ANY(v_urls) AND content_type = v_content_type;
      
      v_processed := v_processed + array_length(v_urls, 1);
      RAISE NOTICE 'Would submit % URLs of type %', array_length(v_urls, 1), v_content_type;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_processed;
END;
$$;