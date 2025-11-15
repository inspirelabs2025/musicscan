-- Delete Miles Davis spotlight
DELETE FROM artist_stories 
WHERE artist_name = 'Miles Davis' 
AND is_spotlight = true;