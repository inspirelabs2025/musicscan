-- Update generate_product_slug function to include 'album-cover' for better SEO
CREATE OR REPLACE FUNCTION generate_product_slug(p_title text, p_artist text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from artist and title
  base_slug := lower(
    regexp_replace(
      trim(coalesce(p_artist, '') || ' ' || p_title), 
      '[^a-zA-Z0-9\s]', '', 'g'
    )
  );
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- If this is a metal print product (contains 'metaalprint'), ensure 'album-cover' is included
  IF base_slug LIKE '%metaalprint%' AND base_slug NOT LIKE '%album-cover%' THEN
    base_slug := regexp_replace(base_slug, 'metaalprint', 'album-cover-metaalprint');
  END IF;
  
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS(SELECT 1 FROM platform_products WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;