-- Deactivate (archive) canvas products that are based on album artwork (not artist photos)
UPDATE platform_products 
SET status = 'archived'
WHERE (tags @> ARRAY['canvas']::text[] OR categories @> ARRAY['CANVAS']::text[])
  AND description LIKE 'Album art products%'
  AND status = 'active';