-- Admin user ID
-- 567d3376-a797-447c-86cb-4c2f1260e997

-- 1. Add superadmin role to the admin user (if not exists)
INSERT INTO user_roles (user_id, role)
VALUES ('567d3376-a797-447c-86cb-4c2f1260e997', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Note: If 'superadmin' is not in the app_role enum, we'll just use 'admin'
-- Check if we need to add superadmin to enum first

-- 2. Update MusicScan shop to be owned by admin user
UPDATE user_shops 
SET user_id = '567d3376-a797-447c-86cb-4c2f1260e997',
    updated_at = now()
WHERE shop_url_slug = 'musicscan';

-- 3. Update all art products (platform_products) to be owned by admin user
UPDATE platform_products 
SET created_by = '567d3376-a797-447c-86cb-4c2f1260e997',
    updated_at = now()
WHERE media_type = 'art' AND created_by = '00000000-0000-0000-0000-000000000001';

-- 4. Clean up the system user profile if it exists (optional)
-- This will cascade and might cause issues, so we'll skip it for now
-- DELETE FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';