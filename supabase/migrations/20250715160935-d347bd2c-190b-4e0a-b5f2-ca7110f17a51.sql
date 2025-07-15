-- Create function to cleanup duplicate CD scans
CREATE OR REPLACE FUNCTION cleanup_duplicate_cd_scans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to cleanup duplicate vinyl scans
CREATE OR REPLACE FUNCTION cleanup_duplicate_vinyl_scans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Add unique constraint to prevent future duplicates (with condition to allow multiple records with pricing)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_cd_scan_unique_incomplete 
ON cd_scan (
    COALESCE(artist, ''), 
    COALESCE(title, ''),
    COALESCE(catalog_number, '')
) 
WHERE condition_grade IS NOT NULL 
  AND calculated_advice_price IS NULL 
  AND discogs_id IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_vinyl2_scan_unique_incomplete 
ON vinyl2_scan (
    COALESCE(artist, ''), 
    COALESCE(title, ''),
    COALESCE(catalog_number, '')
) 
WHERE condition_grade IS NOT NULL 
  AND calculated_advice_price IS NULL 
  AND discogs_id IS NULL;