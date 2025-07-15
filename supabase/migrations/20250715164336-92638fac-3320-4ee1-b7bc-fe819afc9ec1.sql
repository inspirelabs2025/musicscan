-- Backfill missing artist/title data for existing records with Discogs IDs
-- This will help existing scans that have empty artist/title but valid Discogs matches

-- Update CD scans where artist/title is empty but we have a Discogs ID
UPDATE cd_scan 
SET 
  updated_at = now()
WHERE 
  discogs_id IS NOT NULL 
  AND (artist IS NULL OR artist = '' OR artist = 'Unknown')
  AND (title IS NULL OR title = '' OR title = 'Unknown');

-- Update vinyl scans where artist/title is empty but we have a Discogs ID  
UPDATE vinyl2_scan 
SET 
  updated_at = now()
WHERE 
  discogs_id IS NOT NULL 
  AND (artist IS NULL OR artist = '' OR artist = 'Unknown') 
  AND (title IS NULL OR title = '' OR title = 'Unknown');

-- Log the results
DO $$
DECLARE
  cd_count INTEGER;
  vinyl_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cd_count 
  FROM cd_scan 
  WHERE discogs_id IS NOT NULL 
    AND (artist IS NULL OR artist = '' OR artist = 'Unknown')
    AND (title IS NULL OR title = '' OR title = 'Unknown');
    
  SELECT COUNT(*) INTO vinyl_count 
  FROM vinyl2_scan 
  WHERE discogs_id IS NOT NULL 
    AND (artist IS NULL OR artist = '' OR artist = 'Unknown') 
    AND (title IS NULL OR title = '' OR title = 'Unknown');
    
  RAISE NOTICE 'Found % CD records and % vinyl records with missing artist/title but valid Discogs IDs', cd_count, vinyl_count;
END $$;