-- Create trigger function to automatically delete vinyl2_scan records with NULL calculated_advice_price
CREATE OR REPLACE FUNCTION public.cleanup_vinyl2_scan_null_advice_price()
RETURNS TRIGGER AS $$
BEGIN
  -- If calculated_advice_price is NULL, delete the record
  IF NEW.calculated_advice_price IS NULL THEN
    DELETE FROM vinyl2_scan WHERE id = NEW.id;
    RAISE NOTICE 'Auto-deleted vinyl2_scan record % due to NULL calculated_advice_price', NEW.id;
    RETURN NULL; -- Record was deleted, so return NULL
  END IF;
  
  RETURN NEW; -- Keep the record
END;
$$ LANGUAGE plpgsql;

-- Create AFTER INSERT trigger on vinyl2_scan table
CREATE TRIGGER trigger_cleanup_vinyl2_scan_null_advice_price
  AFTER INSERT ON public.vinyl2_scan
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_vinyl2_scan_null_advice_price();

-- Also create AFTER UPDATE trigger to handle updates that set calculated_advice_price to NULL
CREATE TRIGGER trigger_cleanup_vinyl2_scan_null_advice_price_update
  AFTER UPDATE ON public.vinyl2_scan
  FOR EACH ROW
  WHEN (NEW.calculated_advice_price IS NULL AND OLD.calculated_advice_price IS NOT NULL)
  EXECUTE FUNCTION public.cleanup_vinyl2_scan_null_advice_price();

-- One-time cleanup of existing NULL records
DELETE FROM vinyl2_scan WHERE calculated_advice_price IS NULL;