-- Create a unified view that combines all scan tables for proper pagination
CREATE OR REPLACE VIEW public.unified_scans AS
SELECT 
  id,
  created_at,
  updated_at,
  user_id,
  artist,
  title,
  label,
  catalog_number,
  discogs_id,
  discogs_url,
  condition_grade,
  'ai_scan_results' as source_table,
  media_type,
  photo_urls,
  status,
  error_message,
  confidence_score,
  ai_description,
  search_queries,
  genre,
  country,
  format,
  style,
  barcode,
  matrix_number,
  comments,
  year,
  is_flagged_incorrect,
  NULL::numeric as calculated_advice_price,
  NULL::numeric as lowest_price,
  NULL::numeric as median_price,
  NULL::numeric as highest_price,
  NULL::boolean as is_public,
  NULL::boolean as is_for_sale,
  NULL::uuid as release_id
FROM ai_scan_results

UNION ALL

SELECT 
  id,
  created_at,
  updated_at,
  user_id,
  artist,
  title,
  label,
  catalog_number,
  discogs_id,
  discogs_url,
  condition_grade,
  'cd_scan' as source_table,
  'cd' as media_type,
  ARRAY[front_image, back_image, barcode_image]::text[] as photo_urls,
  CASE 
    WHEN calculated_advice_price IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as status,
  NULL as error_message,
  NULL as confidence_score,
  NULL as ai_description,
  NULL as search_queries,
  genre,
  country,
  format,
  style,
  barcode_number as barcode,
  matrix_number,
  NULL as comments,
  year,
  NULL as is_flagged_incorrect,
  calculated_advice_price,
  lowest_price,
  median_price,
  highest_price,
  is_public,
  is_for_sale,
  release_id
FROM cd_scan

UNION ALL

SELECT 
  id,
  created_at,
  updated_at,
  user_id,
  artist,
  title,
  label,
  catalog_number,
  discogs_id,
  discogs_url,
  condition_grade,
  'vinyl2_scan' as source_table,
  'vinyl' as media_type,
  ARRAY[catalog_image, matrix_image, additional_image]::text[] as photo_urls,
  CASE 
    WHEN calculated_advice_price IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as status,
  NULL as error_message,
  NULL as confidence_score,
  NULL as ai_description,
  NULL as search_queries,
  genre,
  country,
  format,
  style,
  NULL as barcode,
  matrix_number,
  NULL as comments,
  year,
  NULL as is_flagged_incorrect,
  calculated_advice_price,
  lowest_price,
  median_price,
  highest_price,
  is_public,
  is_for_sale,
  release_id
FROM vinyl2_scan;

-- Grant access to the view
GRANT SELECT ON public.unified_scans TO authenticated;
GRANT SELECT ON public.unified_scans TO anon;