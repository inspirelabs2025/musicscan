-- Fix search_path for the newly created function (using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.update_photo_batch_queue_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;