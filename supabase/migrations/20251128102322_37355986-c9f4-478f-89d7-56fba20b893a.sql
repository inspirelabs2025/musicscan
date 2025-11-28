-- Delete all €24.95 t-shirt products (standard versions)
DELETE FROM platform_products 
WHERE media_type = 'merchandise' 
  AND categories::text LIKE '%tshirts%' 
  AND price = 24.95;