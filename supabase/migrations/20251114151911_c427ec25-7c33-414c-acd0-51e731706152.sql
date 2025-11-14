-- Delete incomplete Miles Davis spotlight to allow regeneration
DELETE FROM artist_stories 
WHERE artist_name = 'Miles Davis' 
AND is_spotlight = true;