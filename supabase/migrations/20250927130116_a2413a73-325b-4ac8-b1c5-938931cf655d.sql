-- Update Piano Man music story with correct metadata and fetch artwork
UPDATE music_stories 
SET 
  artist = 'Billy Joel',
  single_name = 'Piano Man',
  year = 1973,
  label = 'Columbia',
  genre = 'rock',
  styles = ARRAY['pop rock', 'piano rock'],
  tags = ARRAY['billyjoel', 'rock', 'muziek', 'verhaal', 'geschiedenis'],
  meta_title = 'Het Verhaal Achter Piano Man, Billy Joel - MusicScan',
  meta_description = 'Ontdek het fascinerende verhaal achter Piano Man van Billy Joel. Lees over de achtergrond, productie en impact van dit tijdloze muziekstuk.',
  reading_time = 3,
  word_count = 650
WHERE slug = 'piano-man-billy-joel';