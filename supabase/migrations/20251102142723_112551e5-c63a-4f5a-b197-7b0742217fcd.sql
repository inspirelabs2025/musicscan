-- Cleanup test data: ART products en recente blogs van laatste 48 uur

-- 1. Verwijder alle ART producten (merchandise met discogs_id)
DELETE FROM platform_products 
WHERE media_type = 'merchandise' 
  AND discogs_id IS NOT NULL;

-- 2. Verwijder blogs van laatste 48 uur
DELETE FROM blog_posts 
WHERE created_at >= NOW() - INTERVAL '48 hours';