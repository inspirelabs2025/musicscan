-- Add artwork_url column to releases table to store album cover URLs
ALTER TABLE releases ADD COLUMN IF NOT EXISTS artwork_url text;

-- Update find_or_create_release function to accept and store artwork_url
CREATE OR REPLACE FUNCTION public.find_or_create_release(
  p_discogs_id integer, 
  p_artist text, 
  p_title text, 
  p_label text DEFAULT NULL::text, 
  p_catalog_number text DEFAULT NULL::text, 
  p_year integer DEFAULT NULL::integer, 
  p_format text DEFAULT NULL::text, 
  p_genre text DEFAULT NULL::text, 
  p_country text DEFAULT NULL::text, 
  p_style text[] DEFAULT NULL::text[], 
  p_discogs_url text DEFAULT NULL::text, 
  p_master_id integer DEFAULT NULL::integer,
  p_artwork_url text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  release_uuid uuid;
BEGIN
  -- Try to find existing release by discogs_id
  SELECT id INTO release_uuid 
  FROM public.releases 
  WHERE discogs_id = p_discogs_id;
  
  -- If not found, create new release
  IF release_uuid IS NULL THEN
    INSERT INTO public.releases (
      discogs_id, artist, title, label, catalog_number, year,
      format, genre, country, style, discogs_url, master_id,
      artwork_url, first_scan_date
    ) VALUES (
      p_discogs_id, p_artist, p_title, p_label, p_catalog_number, p_year,
      p_format, p_genre, p_country, p_style, p_discogs_url, p_master_id,
      p_artwork_url, now()
    )
    RETURNING id INTO release_uuid;
  ELSE
    -- Update last_scan_date and any missing metadata, including artwork_url
    UPDATE public.releases 
    SET 
      last_scan_date = now(),
      label = COALESCE(label, p_label),
      catalog_number = COALESCE(catalog_number, p_catalog_number),
      year = COALESCE(year, p_year),
      format = COALESCE(format, p_format),
      genre = COALESCE(genre, p_genre),
      country = COALESCE(country, p_country),
      style = COALESCE(style, p_style),
      discogs_url = COALESCE(discogs_url, p_discogs_url),
      master_id = COALESCE(master_id, p_master_id),
      artwork_url = COALESCE(artwork_url, p_artwork_url),
      updated_at = now()
    WHERE id = release_uuid;
  END IF;
  
  -- Update aggregated data
  PERFORM public.update_release_aggregated_data(release_uuid);
  
  RETURN release_uuid;
END;
$function$;