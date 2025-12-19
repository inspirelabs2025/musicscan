-- Update Trident Studios with a working image URL (using Unsplash recording studio image)
UPDATE studio_stories 
SET artwork_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&q=80'
WHERE studio_name ILIKE '%trident%';