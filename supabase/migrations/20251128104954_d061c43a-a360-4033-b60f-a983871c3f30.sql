-- Backfill photos that failed to be added to fanwall due to trigger error
-- First, create artist fanwalls if they don't exist, then add photos

-- 1. Elvis Presley
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'elvis-presley-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'Elvis Presley Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Elvis Presley'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'b9a17833-de91-4659-bd66-3bfe973557ce'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 2. Axl Rose (first)
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'axl-rose-' || EXTRACT(EPOCH FROM NOW())::bigint || '-1',
  'Axl Rose Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Axl Rose'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'd9fffbe1-ef63-495a-bb5e-cba48135211c'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 3. Madonna
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'madonna-' || EXTRACT(EPOCH FROM NOW())::bigint || '-new',
  'Madonna Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Madonna'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'a087c10e-9c46-44bd-bf04-87e06f33c8a7'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 4. Axl Rose (second)
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'axl-rose-' || EXTRACT(EPOCH FROM NOW())::bigint || '-2',
  'Axl Rose Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Axl Rose'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'c05a980e-2f1d-48d7-8181-d9825c7012ca'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 5. George Michael
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'george-michael-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'George Michael Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van George Michael'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = '955973ac-3772-4972-86df-490bf5d3024e'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 6. Paul McCartney
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'paul-mccartney-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'Paul McCartney Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Paul McCartney'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'a191b03d-64e3-45ac-bfea-8a72cf96997d'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 7. Jimi Hendrix
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'jimi-hendrix-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'Jimi Hendrix Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van Jimi Hendrix'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = '01999b26-0d1b-4e27-a194-77c078ef3fc3'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 8. John Lennon
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'john-lennon-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'John Lennon Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van John Lennon'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'b9dc0c98-271e-4de4-b9fb-a6f7d77c58b5'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- 9. David Bowie and James Brown
INSERT INTO public.photos (user_id, source_type, original_url, display_url, artist, caption, tags, status, seo_slug, seo_title, seo_description, published_at, license_granted, print_allowed)
SELECT 
  ml.user_id,
  'media_library',
  ml.public_url,
  ml.public_url,
  ml.recognized_artist,
  COALESCE(ml.ai_description, ml.recognized_artist || ' fan foto'),
  COALESCE(ml.ai_tags, ARRAY[]::text[]),
  'published',
  'david-bowie-james-brown-' || EXTRACT(EPOCH FROM NOW())::bigint,
  'David Bowie and James Brown Fan Foto',
  COALESCE(ml.ai_description, 'Fan foto van David Bowie and James Brown'),
  NOW(),
  true,
  true
FROM media_library ml
WHERE ml.id = 'c25b9a59-2c39-4915-8adc-c5e7aca229bd'
  AND NOT EXISTS (SELECT 1 FROM photos WHERE original_url = ml.public_url AND user_id = ml.user_id);

-- Mark all processed media library items as sent to fanwall
UPDATE media_library 
SET sent_to_fanwall = true, updated_at = NOW()
WHERE id IN (
  'b9a17833-de91-4659-bd66-3bfe973557ce',
  'd9fffbe1-ef63-495a-bb5e-cba48135211c',
  'a087c10e-9c46-44bd-bf04-87e06f33c8a7',
  'c05a980e-2f1d-48d7-8181-d9825c7012ca',
  '955973ac-3772-4972-86df-490bf5d3024e',
  'a191b03d-64e3-45ac-bfea-8a72cf96997d',
  '01999b26-0d1b-4e27-a194-77c078ef3fc3',
  'b9dc0c98-271e-4de4-b9fb-a6f7d77c58b5',
  'c25b9a59-2c39-4915-8adc-c5e7aca229bd'
);

-- Ensure artist fanwalls exist for new artists
SELECT public.find_or_create_artist_fanwall('Elvis Presley');
SELECT public.find_or_create_artist_fanwall('George Michael');
SELECT public.find_or_create_artist_fanwall('Paul McCartney');
SELECT public.find_or_create_artist_fanwall('Jimi Hendrix');
SELECT public.find_or_create_artist_fanwall('John Lennon');
SELECT public.find_or_create_artist_fanwall('David Bowie and James Brown');