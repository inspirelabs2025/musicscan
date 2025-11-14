-- Delete Miles Davis spotlight to allow regeneration with increased token limit
DELETE FROM artist_stories 
WHERE artist_name = 'Miles Davis' 
AND is_spotlight = true;