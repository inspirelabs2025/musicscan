-- Create vinyl2_scan table for new LP/CD scanning functionality
CREATE TABLE public.vinyl2_scan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Image uploads (base64 or file paths)
  catalog_image TEXT,
  matrix_image TEXT, 
  additional_image TEXT,
  
  -- Discogs information
  discogs_id INTEGER,
  discogs_url TEXT,
  artist TEXT,
  title TEXT,
  year INTEGER,
  label TEXT,
  catalog_number TEXT,
  matrix_number TEXT,
  format TEXT,
  genre TEXT,
  country TEXT,
  
  -- Price information
  lowest_price DECIMAL(10,2),
  median_price DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  currency TEXT DEFAULT '€',
  
  -- Condition and calculated price
  condition_grade TEXT, -- mint, very good, etc.
  calculated_advice_price DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vinyl2_scan ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (as per existing pattern)
CREATE POLICY "Allow anonymous read access" 
ON public.vinyl2_scan 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert access" 
ON public.vinyl2_scan 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" 
ON public.vinyl2_scan 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vinyl2_scan_updated_at
BEFORE UPDATE ON public.vinyl2_scan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();