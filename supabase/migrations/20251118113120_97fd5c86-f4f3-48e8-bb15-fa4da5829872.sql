-- Verwijder alle producten uit The Doors batch (fa64d037-9607-44d3-9384-1eeed8063c78)

-- Verwijder platform_products (posters, canvas, t-shirts zijn hier)
DELETE FROM platform_products
WHERE created_at BETWEEN '2025-11-18 11:16:00' AND '2025-11-18 11:21:00'
  AND artist = 'The Doors';

-- Verwijder album_tshirts
DELETE FROM album_tshirts
WHERE id = '49180532-c8c2-4eac-b925-e1a6693c3e53';

-- Clean up photo_batch_queue
DELETE FROM photo_batch_queue
WHERE id = 'fa64d037-9607-44d3-9384-1eeed8063c78';