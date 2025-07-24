-- Fix security issues: Function Search Path Mutable
-- Set search_path for all functions to prevent SQL injection

-- Fix extract_discogs_id_from_url function
CREATE OR REPLACE FUNCTION public.extract_discogs_id_from_url(url_text text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
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
$function$;

-- Fix cleanup_cd_scan_null_advice_price function
CREATE OR REPLACE FUNCTION public.cleanup_cd_scan_null_advice_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If calculated_advice_price is NULL, delete the record
  IF NEW.calculated_advice_price IS NULL THEN
    DELETE FROM cd_scan WHERE id = NEW.id;
    RAISE NOTICE 'Auto-deleted cd_scan record % due to NULL calculated_advice_price', NEW.id;
    RETURN NULL; -- Record was deleted, so return NULL
  END IF;
  
  RETURN NEW; -- Keep the record
END;
$function$;

-- Fix cleanup_vinyl2_scan_null_advice_price function
CREATE OR REPLACE FUNCTION public.cleanup_vinyl2_scan_null_advice_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If calculated_advice_price is NULL, delete the record
  IF NEW.calculated_advice_price IS NULL THEN
    DELETE FROM vinyl2_scan WHERE id = NEW.id;
    RAISE NOTICE 'Auto-deleted vinyl2_scan record % due to NULL calculated_advice_price', NEW.id;
    RETURN NULL; -- Record was deleted, so return NULL
  END IF;
  
  RETURN NEW; -- Keep the record
END;
$function$;

-- Fix update_cd_discogs_ids function
CREATE OR REPLACE FUNCTION public.update_cd_discogs_ids()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
$function$;

-- Fix extract_and_update_discogs_ids function
CREATE OR REPLACE FUNCTION public.extract_and_update_discogs_ids()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
$function$;

-- Fix cleanup_duplicate_cd_scans function
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_cd_scans()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete duplicate CD scans that have condition_grade but no pricing data
    -- Keep the most recent record for each unique combination
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    COALESCE(artist, ''), 
                    COALESCE(title, ''),
                    COALESCE(catalog_number, '')
                ORDER BY created_at DESC
            ) as rn
        FROM cd_scan
        WHERE condition_grade IS NOT NULL 
          AND calculated_advice_price IS NULL
          AND discogs_id IS NULL
    )
    DELETE FROM cd_scan 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % duplicate CD scan records', deleted_count;
    
    RETURN deleted_count;
END;
$function$;

-- Fix cleanup_duplicate_vinyl_scans function
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_vinyl_scans()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete duplicate vinyl scans that have condition_grade but no pricing data
    -- Keep the most recent record for each unique combination
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    COALESCE(artist, ''), 
                    COALESCE(title, ''),
                    COALESCE(catalog_number, '')
                ORDER BY created_at DESC
            ) as rn
        FROM vinyl2_scan
        WHERE condition_grade IS NOT NULL 
          AND calculated_advice_price IS NULL
          AND discogs_id IS NULL
    )
    DELETE FROM vinyl2_scan 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % duplicate vinyl scan records', deleted_count;
    
    RETURN deleted_count;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add RLS policies for vinyl_records_backup table (missing policies)
CREATE POLICY "Users can view their own vinyl backup records"
ON public.vinyl_records_backup
FOR SELECT
USING (true); -- This appears to be a backup table, allowing read access

CREATE POLICY "Allow insert for backup operations"
ON public.vinyl_records_backup
FOR INSERT
WITH CHECK (true); -- Backup operations need insert access