-- Fix trigger_indexnow_product to use published_at instead of non-existent is_published column
CREATE OR REPLACE FUNCTION public.trigger_indexnow_product()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if product is active and published
  IF NEW.status = 'active' AND NEW.published_at IS NOT NULL AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'active' OR OLD.published_at IS NULL))) THEN
    PERFORM public.submit_to_indexnow(
      '/product/' || NEW.slug,
      'product'
    );
  END IF;
  RETURN NEW;
END;
$function$;