-- Create canonical releases table
CREATE TABLE public.releases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discogs_id integer UNIQUE NOT NULL,
  artist text NOT NULL,
  title text NOT NULL,
  label text,
  catalog_number text,
  year integer,
  format text,
  genre text,
  country text,
  style text[],
  discogs_url text,
  master_id integer,
  
  -- Aggregated data from all scans
  total_scans integer DEFAULT 0,
  price_range_min numeric,
  price_range_max numeric,
  condition_counts jsonb DEFAULT '{}',
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  first_scan_date timestamp with time zone,
  last_scan_date timestamp with time zone
);

-- Enable RLS on releases table
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

-- Create policy for releases - publicly viewable
CREATE POLICY "Releases are viewable by everyone" 
ON public.releases 
FOR SELECT 
USING (true);

-- Allow authenticated users to create/update releases
CREATE POLICY "Authenticated users can create releases" 
ON public.releases 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update releases" 
ON public.releases 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Add release_id to existing scan tables
ALTER TABLE public.cd_scan ADD COLUMN release_id uuid REFERENCES public.releases(id);
ALTER TABLE public.vinyl2_scan ADD COLUMN release_id uuid REFERENCES public.releases(id);

-- Create indexes for performance
CREATE INDEX idx_releases_discogs_id ON public.releases(discogs_id);
CREATE INDEX idx_cd_scan_release_id ON public.cd_scan(release_id);
CREATE INDEX idx_vinyl2_scan_release_id ON public.vinyl2_scan(release_id);

-- Create function to update release aggregated data
CREATE OR REPLACE FUNCTION public.update_release_aggregated_data(release_uuid uuid)
RETURNS void AS $$
DECLARE
  cd_count integer := 0;
  vinyl_count integer := 0;
  min_price numeric;
  max_price numeric;
  conditions jsonb := '{}';
BEGIN
  -- Count scans for this release
  SELECT COUNT(*) INTO cd_count FROM cd_scan WHERE release_id = release_uuid;
  SELECT COUNT(*) INTO vinyl_count FROM vinyl2_scan WHERE release_id = release_uuid;
  
  -- Get price range from both tables
  SELECT 
    LEAST(
      COALESCE((SELECT MIN(calculated_advice_price) FROM cd_scan WHERE release_id = release_uuid), 999999),
      COALESCE((SELECT MIN(calculated_advice_price) FROM vinyl2_scan WHERE release_id = release_uuid), 999999)
    ),
    GREATEST(
      COALESCE((SELECT MAX(calculated_advice_price) FROM cd_scan WHERE release_id = release_uuid), 0),
      COALESCE((SELECT MAX(calculated_advice_price) FROM vinyl2_scan WHERE release_id = release_uuid), 0)
    )
  INTO min_price, max_price;
  
  -- Update release with aggregated data
  UPDATE public.releases 
  SET 
    total_scans = cd_count + vinyl_count,
    price_range_min = CASE WHEN min_price = 999999 THEN NULL ELSE min_price END,
    price_range_max = CASE WHEN max_price = 0 THEN NULL ELSE max_price END,
    updated_at = now()
  WHERE id = release_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find or create release
CREATE OR REPLACE FUNCTION public.find_or_create_release(
  p_discogs_id integer,
  p_artist text,
  p_title text,
  p_label text DEFAULT NULL,
  p_catalog_number text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_format text DEFAULT NULL,
  p_genre text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_style text[] DEFAULT NULL,
  p_discogs_url text DEFAULT NULL,
  p_master_id integer DEFAULT NULL
)
RETURNS uuid AS $$
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
      first_scan_date
    ) VALUES (
      p_discogs_id, p_artist, p_title, p_label, p_catalog_number, p_year,
      p_format, p_genre, p_country, p_style, p_discogs_url, p_master_id,
      now()
    )
    RETURNING id INTO release_uuid;
  ELSE
    -- Update last_scan_date and any missing metadata
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
      updated_at = now()
    WHERE id = release_uuid;
  END IF;
  
  -- Update aggregated data
  PERFORM public.update_release_aggregated_data(release_uuid);
  
  RETURN release_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update release data when scans change
CREATE OR REPLACE FUNCTION public.update_release_on_scan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT/UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.release_id IS NOT NULL THEN
      PERFORM public.update_release_aggregated_data(NEW.release_id);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.release_id IS NOT NULL THEN
      PERFORM public.update_release_aggregated_data(OLD.release_id);
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both scan tables
CREATE TRIGGER update_release_data_cd_scan
  AFTER INSERT OR UPDATE OR DELETE ON public.cd_scan
  FOR EACH ROW EXECUTE FUNCTION public.update_release_on_scan_change();

CREATE TRIGGER update_release_data_vinyl2_scan
  AFTER INSERT OR UPDATE OR DELETE ON public.vinyl2_scan
  FOR EACH ROW EXECUTE FUNCTION public.update_release_on_scan_change();