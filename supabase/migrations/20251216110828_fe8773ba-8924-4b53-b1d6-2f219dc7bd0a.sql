-- Delete all Christmas socks except Elvis Presley and Mariah Carey
DELETE FROM album_socks 
WHERE pattern_type = 'christmas' 
AND artist_name NOT IN ('Elvis Presley', 'Mariah Carey');