-- Fix trigger_indexnow_product to stop referencing non-existent column is_published
CREATE OR REPLACE FUNCTION public.trigger_indexnow_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only submit to IndexNow when product becomes active and has a published_at timestamp
  IF NEW.status = 'active' AND NEW.published_at IS NOT NULL AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.published_at IS DISTINCT FROM NEW.published_at))) THEN
    PERFORM public.submit_to_indexnow('/product/' || NEW.slug, 'product');
  END IF;
  RETURN NEW;
END;
$$;