-- Fix security warning for trigger function by setting search_path
CREATE OR REPLACE FUNCTION public.update_time_machine_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;