-- Create function to extract Discogs ID from URL and update existing records
CREATE OR REPLACE FUNCTION public.extract_and_update_discogs_ids()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Log the function execution
  RAISE NOTICE 'Starting Discogs ID extraction from URLs...';
  
  -- Update cd_scan records
  UPDATE cd_scan 
  SET discogs_id = CAST(
    SUBSTRING(discogs_url FROM 'release/([0-9]+)')
    AS INTEGER
  )
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % CD scan records', updated_count;
  
  -- Update vinyl2_scan records
  UPDATE vinyl2_scan 
  SET discogs_id = CAST(
    SUBSTRING(discogs_url FROM 'release/([0-9]+)')
    AS INTEGER
  )
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % vinyl2 scan records', updated_count;
  
  -- Update vinyl_records records
  UPDATE vinyl_records 
  SET discogs_id = CAST(
    SUBSTRING(discogs_url FROM 'release/([0-9]+)')
    AS INTEGER
  )
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % vinyl records', updated_count;
  
  -- Return total count of updated records
  SELECT 
    COALESCE(
      (SELECT COUNT(*) FROM cd_scan WHERE discogs_id IS NOT NULL AND discogs_url IS NOT NULL), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM vinyl2_scan WHERE discogs_id IS NOT NULL AND discogs_url IS NOT NULL), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM vinyl_records WHERE discogs_id IS NOT NULL AND discogs_url IS NOT NULL), 0
    )
  INTO updated_count;
  
  RETURN updated_count;
END;
$function$

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