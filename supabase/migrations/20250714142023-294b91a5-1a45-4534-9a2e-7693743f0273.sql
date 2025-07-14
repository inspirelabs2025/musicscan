-- Function to update CD records with missing Discogs IDs
CREATE OR REPLACE FUNCTION public.update_cd_discogs_ids()
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  updated_count INTEGER := 0;
  cd_record RECORD;
BEGIN
  -- Update records where we can make educated guesses based on known patterns
  
  -- Log the function execution
  RAISE NOTICE 'Starting CD Discogs ID updates...';
  
  -- Update specific known releases
  UPDATE cd_scan 
  SET 
    discogs_id = 1807698,
    discogs_url = 'https://www.discogs.com/release/1807698'
  WHERE 
    discogs_id IS NULL 
    AND (
      catalog_number ILIKE '%SK 8012%' 
      OR barcode_number ILIKE '%731453801226%'
      OR (artist ILIKE '%atomic swing%' AND title ILIKE '%car crash%')
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % Atomic Swing records', updated_count;
  
  RETURN updated_count;
END;
$function$