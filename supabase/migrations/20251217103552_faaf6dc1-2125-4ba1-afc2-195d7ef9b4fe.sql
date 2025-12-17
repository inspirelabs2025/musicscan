
-- Create a new batch for artist story generation
INSERT INTO batch_processing_status (
  id,
  process_type,
  status,
  total_items,
  processed_items,
  successful_items,
  failed_items,
  started_at
) VALUES (
  gen_random_uuid(),
  'artist_story_generation',
  'pending',
  105,
  0,
  0,
  0,
  now()
);

-- Get the batch ID we just created and insert artists
DO $$
DECLARE
  v_batch_id uuid;
BEGIN
  SELECT id INTO v_batch_id FROM batch_processing_status 
  WHERE process_type = 'artist_story_generation' 
  ORDER BY created_at DESC LIMIT 1;

  -- Hip-hop/Rap (20)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Eminem', 'Jay-Z', 'Kanye West', 'Drake', 'Kendrick Lamar',
    'Nas', 'Tupac Shakur', 'The Notorious B.I.G.', 'OutKast', 'Snoop Dogg',
    '50 Cent', 'Ice Cube', 'Dr. Dre', 'Wu-Tang Clan', 'A$AP Rocky',
    'Tyler, The Creator', 'J. Cole', 'Travis Scott', 'Lil Wayne', 'Post Malone'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- R&B/Soul (15)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Beyoncé', 'Rihanna', 'Whitney Houston', 'Stevie Wonder',
    'Adele', 'Amy Winehouse', 'Alicia Keys', 'Mary J. Blige', 'Usher',
    'The Weeknd', 'Bruno Mars', 'Frank Ocean', 'SZA', 'H.E.R.', 'Lauryn Hill'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Modern Pop (15)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Taylor Swift', 'Ed Sheeran', 'Billie Eilish', 'Lady Gaga',
    'Katy Perry', 'Ariana Grande', 'Dua Lipa', 'Harry Styles',
    'Shakira', 'Celine Dion', 'Justin Bieber', 'Sia', 'Lorde', 'Miley Cyrus', 'Selena Gomez'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Dance/Electronic (15)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Calvin Harris', 'Avicii', 'deadmau5', 'Skrillex',
    'Martin Garrix', 'Hardwell', 'David Guetta',
    'The Chemical Brothers', 'Fatboy Slim', 'Moby', 'Swedish House Mafia',
    'Disclosure', 'Kygo', 'Marshmello', 'Diplo'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Country (10)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Johnny Cash', 'Dolly Parton', 'Willie Nelson',
    'Garth Brooks', 'Shania Twain', 'Kenny Rogers', 
    'John Denver', 'Carrie Underwood', 'Luke Combs', 'Chris Stapleton'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Nederlands (15)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Guus Meeuwis', 'Nick & Simon', 'Frans Bauer',
    'Di-rect', 'BLØF', 'Krezip', 'Kane',
    'Trijntje Oosterhuis', 'Jan Smit', 'René Froger', 
    'Gerard Joling', 'Racoon', 'Chef''Special', 'Kensington', 'De Staat'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Classical/Jazz (15)
  INSERT INTO batch_queue_items (batch_id, item_id, item_type, metadata, status, priority)
  SELECT v_batch_id, gen_random_uuid(), 'artist_story', jsonb_build_object('artist_name', artist), 'pending', 1
  FROM unnest(ARRAY[
    'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach',
    'Billie Holiday', 'Ella Fitzgerald', 'Louis Armstrong',
    'Duke Ellington', 'Charlie Parker', 'Nina Simone', 'Miles Davis',
    'John Coltrane', 'Thelonious Monk', 'Frédéric Chopin', 'Claude Debussy', 'Antonio Vivaldi'
  ]) AS artist
  WHERE NOT EXISTS (SELECT 1 FROM artist_stories WHERE LOWER(artist_name) = LOWER(artist));

  -- Update total_items count based on actual inserts
  UPDATE batch_processing_status 
  SET total_items = (SELECT COUNT(*) FROM batch_queue_items WHERE batch_id = v_batch_id)
  WHERE id = v_batch_id;

END $$;
