-- Update existing CD scans with known Discogs IDs based on catalog numbers and barcodes

-- Update Atomic Swing - A Car Crash in the Blue records
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

-- Create a function to batch update CD scans with Discogs search
CREATE OR REPLACE FUNCTION update_cd_discogs_ids()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Execute the function
SELECT update_cd_discogs_ids();