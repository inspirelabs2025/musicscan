-- Drop and recreate function with proper permissions
DROP FUNCTION IF EXISTS public.update_cd_discogs_ids();

CREATE OR REPLACE FUNCTION public.update_cd_discogs_ids()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
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
      catalog_number ILIKE '%517 830-2%' 
      OR barcode_number ILIKE '%731451783029%'
      OR (artist ILIKE '%atomic swing%' AND title ILIKE '%car crash%')
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % Atomic Swing records', updated_count;
  
  RETURN updated_count;
END;
$function$