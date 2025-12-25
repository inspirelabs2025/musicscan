
-- Create a function to sync singles_processed counts efficiently
CREATE OR REPLACE FUNCTION public.sync_artist_singles_counts()
RETURNS TABLE(updated_count integer) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  -- Update singles_processed from music_stories
  WITH singles_counts AS (
    SELECT 
      LOWER(artist) as artist_lower,
      COUNT(*) as cnt
    FROM music_stories 
    WHERE single_name IS NOT NULL 
      AND is_published = true
    GROUP BY LOWER(artist)
  )
  UPDATE curated_artists ca
  SET singles_processed = COALESCE(sc.cnt, 0)
  FROM singles_counts sc
  WHERE LOWER(ca.artist_name) = sc.artist_lower
    AND (ca.singles_processed IS NULL OR ca.singles_processed != sc.cnt);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Update has_artist_story from artist_stories
  UPDATE curated_artists ca
  SET 
    has_artist_story = true,
    artist_story_id = ast.id
  FROM artist_stories ast
  WHERE LOWER(ast.artist_name) = LOWER(ca.artist_name)
    AND ast.is_published = true
    AND (ca.has_artist_story IS NOT TRUE OR ca.artist_story_id IS NULL);
  
  RETURN QUERY SELECT v_updated;
END;
$$;
