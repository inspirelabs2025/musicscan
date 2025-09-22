-- Create function to increment shop view count
CREATE OR REPLACE FUNCTION increment_shop_view_count(shop_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_shops 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE shop_url_slug = shop_slug AND is_public = true;
END;
$$;