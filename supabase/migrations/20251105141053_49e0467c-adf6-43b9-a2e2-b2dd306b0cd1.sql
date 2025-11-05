-- Verplaats alle CD's van winkel terug naar collectie
UPDATE cd_scan 
SET 
  is_for_sale = false,
  marketplace_status = NULL,
  marketplace_price = NULL,
  updated_at = now()
WHERE is_for_sale = true;

-- Log het aantal verplaatste items
DO $$
DECLARE
  moved_count INTEGER;
BEGIN
  GET DIAGNOSTICS moved_count = ROW_COUNT;
  RAISE NOTICE 'Verplaatst % CD''s van winkel naar collectie', moved_count;
END $$;