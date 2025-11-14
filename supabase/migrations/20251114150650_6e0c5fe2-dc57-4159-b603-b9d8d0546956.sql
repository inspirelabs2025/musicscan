-- Delete Miles Davis spotlight for testing duplicate detection
DELETE FROM artist_stories 
WHERE id = '4faf90a3-395c-4bd2-8589-c563d7f24e36' 
AND artist_name = 'Miles Davis' 
AND is_spotlight = true;