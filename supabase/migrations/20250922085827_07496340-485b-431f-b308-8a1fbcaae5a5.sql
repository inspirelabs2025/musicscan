-- Fix user_shops table issues
-- Add unique constraint for shop_url_slug
ALTER TABLE user_shops ADD CONSTRAINT user_shops_shop_url_slug_unique UNIQUE (shop_url_slug);

-- Create function to generate slug from shop name
CREATE OR REPLACE FUNCTION generate_shop_slug(shop_name TEXT)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Update existing shops with null/empty slugs
UPDATE user_shops 
SET shop_url_slug = generate_shop_slug(COALESCE(shop_name, 'shop-' || SUBSTRING(id::TEXT FROM 1 FOR 8)))
WHERE shop_url_slug IS NULL OR shop_url_slug = '';

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_shop_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- If shop_url_slug is empty/null and shop_name exists, generate slug
  IF (NEW.shop_url_slug IS NULL OR NEW.shop_url_slug = '') AND NEW.shop_name IS NOT NULL AND NEW.shop_name != '' THEN
    NEW.shop_url_slug := generate_shop_slug(NEW.shop_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_shop_slug
  BEFORE INSERT OR UPDATE ON user_shops
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_shop_slug();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_shops_slug ON user_shops(shop_url_slug);
CREATE INDEX IF NOT EXISTS idx_user_shops_public ON user_shops(is_public) WHERE is_public = true;