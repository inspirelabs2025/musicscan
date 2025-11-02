-- Cleanup van alle producten en blogs aangemaakt vandaag (2025-11-02)

-- Verwijder eerst de blogs (vanwege mogelijke foreign key references)
DELETE FROM blog_posts 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- Verwijder daarna de producten
DELETE FROM platform_products 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';