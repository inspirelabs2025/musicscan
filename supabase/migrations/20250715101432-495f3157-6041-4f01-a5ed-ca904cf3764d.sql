-- Create function to extract Discogs ID from URL and update existing records
CREATE OR REPLACE FUNCTION public.extract_and_update_discogs_ids()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Log the function execution
  RAISE NOTICE 'Starting Discogs ID extraction from URLs...';
  
  -- Update cd_scan records
  UPDATE cd_scan 
  SET discogs_id = public.extract_discogs_id_from_url(discogs_url)
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  total_count := total_count + updated_count;
  RAISE NOTICE 'Updated % CD scan records', updated_count;
  
  -- Update vinyl2_scan records
  UPDATE vinyl2_scan 
  SET discogs_id = public.extract_discogs_id_from_url(discogs_url)
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  total_count := total_count + updated_count;
  RAISE NOTICE 'Updated % vinyl2 scan records', updated_count;
  
  -- Update vinyl_records records
  UPDATE vinyl_records 
  SET discogs_id = public.extract_discogs_id_from_url(discogs_url)
  WHERE discogs_id IS NULL 
    AND discogs_url IS NOT NULL 
    AND discogs_url ~ 'release/[0-9]+';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  total_count := total_count + updated_count;
  RAISE NOTICE 'Updated % vinyl records', updated_count;
  
  RETURN total_count;
END;
$function$