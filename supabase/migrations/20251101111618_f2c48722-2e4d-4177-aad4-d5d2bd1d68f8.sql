-- Fix security warnings for new platform shop functions
-- Add search_path to SECURITY DEFINER functions

-- Fix increment_product_view function
CREATE OR REPLACE FUNCTION increment_product_view(p_product_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE platform_products 
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = p_product_id;
END;
$$;

-- Fix decrement_product_stock function
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_quantity integer DEFAULT 1)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM platform_products
  WHERE id = p_product_id;
  
  IF current_stock < p_quantity THEN
    RETURN false;
  END IF;
  
  UPDATE platform_products 
  SET 
    stock_quantity = stock_quantity - p_quantity,
    purchase_count = purchase_count + p_quantity,
    last_purchased_at = now(),
    status = CASE 
      WHEN stock_quantity - p_quantity <= 0 THEN 'sold_out'
      ELSE status
    END
  WHERE id = p_product_id;
  
  RETURN true;
END;
$$;