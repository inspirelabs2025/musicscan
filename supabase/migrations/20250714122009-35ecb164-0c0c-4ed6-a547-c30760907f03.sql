-- Create cd_scan table similar to vinyl2_scan but for CDs
CREATE TABLE public.cd_scan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- CD Images (different from vinyl)
  front_image TEXT,
  back_image TEXT, 
  barcode_image TEXT,
  
  -- Extracted information
  barcode_number TEXT,
  artist TEXT,
  title TEXT,
  label TEXT,
  catalog_number TEXT,
  year INTEGER,
  format TEXT,
  genre TEXT,
  country TEXT,
  
  -- Discogs data
  discogs_id INTEGER,
  discogs_url TEXT,
  
  -- Pricing data
  currency TEXT DEFAULT '€',
  lowest_price NUMERIC,
  median_price NUMERIC,
  highest_price NUMERIC,
  
  -- Condition assessment
  condition_grade TEXT,
  calculated_advice_price NUMERIC
);

-- Enable Row Level Security
ALTER TABLE public.cd_scan ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (same as vinyl2_scan)
CREATE POLICY "Allow anonymous read access" 
ON public.cd_scan 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert access" 
ON public.cd_scan 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" 
ON public.cd_scan 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cd_scan_updated_at
BEFORE UPDATE ON public.cd_scan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();