-- Create utility function to extract Discogs ID from URL
CREATE OR REPLACE FUNCTION public.extract_discogs_id_from_url(url_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF url_text IS NULL OR url_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Extract ID from patterns like:
  -- https://www.discogs.com/release/588618
  -- https://discogs.com/release/588618-artist-title
  -- /release/588618
  IF url_text ~ 'release/[0-9]+' THEN
    RETURN CAST(SUBSTRING(url_text FROM 'release/([0-9]+)') AS INTEGER);
  END IF;
  
  RETURN NULL;
END;
$function$