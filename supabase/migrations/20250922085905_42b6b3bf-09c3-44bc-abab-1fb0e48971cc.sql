-- Fix search path for the functions I just created
CREATE OR REPLACE FUNCTION generate_shop_slug(shop_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from shop name
  base_slug := lower(regexp_replace(trim(shop_name), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- If shop_name is empty, use 'shop' as base
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'shop';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS(SELECT 1 FROM user_shops WHERE shop_url_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION auto_generate_shop_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If shop_url_slug is empty/null and shop_name exists, generate slug
  IF (NEW.shop_url_slug IS NULL OR NEW.shop_url_slug = '') AND NEW.shop_name IS NOT NULL AND NEW.shop_name != '' THEN
    NEW.shop_url_slug := generate_shop_slug(NEW.shop_name);
  END IF;
  
  RETURN NEW;
END;
$$;