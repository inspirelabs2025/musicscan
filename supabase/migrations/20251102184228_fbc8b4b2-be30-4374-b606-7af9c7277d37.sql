-- First: Update the check constraint to allow 'art' media type
ALTER TABLE public.platform_products 
DROP CONSTRAINT platform_products_media_type_check;

ALTER TABLE public.platform_products 
ADD CONSTRAINT platform_products_media_type_check 
CHECK (media_type = ANY (ARRAY['cd'::text, 'vinyl'::text, 'merchandise'::text, 'book'::text, 'accessory'::text, 'boxset'::text, 'art'::text]));

-- Then: Update all merchandise to art with metaal album cover category
UPDATE public.platform_products
SET 
  media_type = 'art',
  categories = CASE 
    WHEN categories IS NULL THEN ARRAY['metaal album cover']::text[]
    WHEN NOT ('metaal album cover' = ANY(categories)) THEN categories || ARRAY['metaal album cover']
    ELSE categories
  END,
  updated_at = now()
WHERE media_type = 'merchandise';