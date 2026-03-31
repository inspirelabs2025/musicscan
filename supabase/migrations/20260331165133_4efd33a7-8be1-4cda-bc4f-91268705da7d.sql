-- Archive album-based poster products (keep only artist photo posters)
UPDATE platform_products 
SET status = 'archived'
WHERE (tags @> ARRAY['poster']::text[] OR categories @> ARRAY['POSTER']::text[])
  AND description LIKE 'Album art products%'
  AND status = 'active';