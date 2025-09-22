-- Fix security warnings by updating existing functions
-- Update the update_shop_orders_updated_at function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_shop_orders_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;