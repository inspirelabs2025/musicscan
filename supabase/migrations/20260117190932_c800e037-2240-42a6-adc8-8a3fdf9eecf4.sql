-- Update all existing t-shirt prices to €39.95
UPDATE platform_products 
SET price = 39.95, updated_at = NOW() 
WHERE categories::text ILIKE '%tshirt%';