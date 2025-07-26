-- Migrate existing scans to the releases system
-- First, create releases for all existing CD scans with discogs_id
INSERT INTO public.releases (
  discogs_id, artist, title, label, catalog_number, year,
  format, genre, country, style, discogs_url, first_scan_date
)
SELECT DISTINCT 
  discogs_id,
  COALESCE(artist, 'Unknown Artist'),
  COALESCE(title, 'Unknown Title'),
  label,
  catalog_number,
  year,
  format,
  genre,
  country,
  style,
  discogs_url,
  MIN(created_at)
FROM cd_scan 
WHERE discogs_id IS NOT NULL
GROUP BY discogs_id, artist, title, label, catalog_number, year, format, genre, country, style, discogs_url
ON CONFLICT (discogs_id) DO NOTHING;

-- Create releases for vinyl scans with discogs_id
INSERT INTO public.releases (
  discogs_id, artist, title, label, catalog_number, year,
  format, genre, country, style, discogs_url, first_scan_date
)
SELECT DISTINCT 
  discogs_id,
  COALESCE(artist, 'Unknown Artist'),
  COALESCE(title, 'Unknown Title'),
  label,
  catalog_number,
  year,
  format,
  genre,
  country,
  style,
  discogs_url,
  MIN(created_at)
FROM vinyl2_scan 
WHERE discogs_id IS NOT NULL
GROUP BY discogs_id, artist, title, label, catalog_number, year, format, genre, country, style, discogs_url
ON CONFLICT (discogs_id) DO NOTHING;

-- Now link existing CD scans to their releases
UPDATE cd_scan 
SET release_id = (
  SELECT id FROM public.releases WHERE releases.discogs_id = cd_scan.discogs_id
)
WHERE discogs_id IS NOT NULL AND release_id IS NULL;

-- Link existing vinyl scans to their releases  
UPDATE vinyl2_scan 
SET release_id = (
  SELECT id FROM public.releases WHERE releases.discogs_id = vinyl2_scan.discogs_id
)
WHERE discogs_id IS NOT NULL AND release_id IS NULL;

-- Update aggregated data for all releases
UPDATE public.releases 
SET 
  total_scans = (
    SELECT COUNT(*) 
    FROM (
      SELECT 1 FROM cd_scan WHERE cd_scan.release_id = releases.id
      UNION ALL
      SELECT 1 FROM vinyl2_scan WHERE vinyl2_scan.release_id = releases.id
    ) combined
  ),
  price_range_min = (
    SELECT MIN(price) FROM (
      SELECT calculated_advice_price as price FROM cd_scan WHERE cd_scan.release_id = releases.id AND calculated_advice_price IS NOT NULL
      UNION ALL
      SELECT calculated_advice_price as price FROM vinyl2_scan WHERE vinyl2_scan.release_id = releases.id AND calculated_advice_price IS NOT NULL
    ) prices
  ),
  price_range_max = (
    SELECT MAX(price) FROM (
      SELECT calculated_advice_price as price FROM cd_scan WHERE cd_scan.release_id = releases.id AND calculated_advice_price IS NOT NULL
      UNION ALL
      SELECT calculated_advice_price as price FROM vinyl2_scan WHERE vinyl2_scan.release_id = releases.id AND calculated_advice_price IS NOT NULL
    ) prices
  ),
  last_scan_date = (
    SELECT MAX(scan_date) FROM (
      SELECT created_at as scan_date FROM cd_scan WHERE cd_scan.release_id = releases.id
      UNION ALL
      SELECT created_at as scan_date FROM vinyl2_scan WHERE vinyl2_scan.release_id = releases.id
    ) scan_dates
  );