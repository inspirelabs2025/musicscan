-- Delete duplicate Jessie J products (keep newest of each type)
DELETE FROM platform_products 
WHERE id IN (
  '0ba6a8ef-45ed-467f-a42e-e9f33fe47679',  -- Older T-Shirt
  '4c3e9168-66bc-496a-a585-66b53b0912d9',  -- Older Canvas
  '09fa7f8b-1331-4956-b44b-125f804f071d'   -- Older Poster
);