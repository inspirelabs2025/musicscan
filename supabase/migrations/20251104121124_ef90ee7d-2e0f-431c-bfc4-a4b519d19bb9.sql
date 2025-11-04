
-- Update all art products to €49.95
UPDATE platform_products 
SET price = 49.95,
    updated_at = now()
WHERE media_type = 'art' 
  AND price != 49.95;
