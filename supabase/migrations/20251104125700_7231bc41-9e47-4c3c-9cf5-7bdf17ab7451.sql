-- Link all art products to MusicScan shop (system user)
UPDATE platform_products 
SET created_by = '00000000-0000-0000-0000-000000000001'
WHERE media_type = 'art' AND (created_by IS NULL OR created_by != '00000000-0000-0000-0000-000000000001');