-- Create system user profile for MusicScan
INSERT INTO public.profiles (id, user_id, first_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'MusicScan'
)
ON CONFLICT (id) DO NOTHING;

-- Create MusicScan shop in user_shops
INSERT INTO public.user_shops (user_id, shop_name, shop_description, shop_url_slug, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MusicScan Hoofdshop',
  'Officiële MusicScan collectie en verkoop',
  'musicscan',
  true
)
ON CONFLICT (shop_url_slug) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  shop_description = EXCLUDED.shop_description,
  is_public = EXCLUDED.is_public,
  updated_at = now();