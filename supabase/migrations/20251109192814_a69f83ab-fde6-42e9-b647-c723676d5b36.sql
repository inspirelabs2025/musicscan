-- 1. First remove the standard_product_id column (this drops the foreign key constraint)
ALTER TABLE album_socks DROP COLUMN IF EXISTS standard_product_id;

-- 2. Now we can safely delete standard cotton sock products (€14.95)
DELETE FROM platform_products 
WHERE categories @> ARRAY['socks'] 
AND price = 14.95;

-- 3. Rename premium_product_id to product_id for clarity
ALTER TABLE album_socks RENAME COLUMN premium_product_id TO product_id;