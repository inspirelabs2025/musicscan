-- Create ai_scan_results table for AI-powered photo analysis
CREATE TABLE public.ai_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_urls TEXT[] NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('vinyl', 'cd')),
  condition_grade TEXT NOT NULL,
  discogs_id INTEGER,
  discogs_url TEXT,
  artist TEXT,
  title TEXT,
  label TEXT,
  catalog_number TEXT,
  year INTEGER,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  analysis_data JSONB,
  ai_description TEXT,
  search_queries TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (matching existing pattern)
CREATE POLICY "Allow anonymous insert access" 
ON public.ai_scan_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" 
ON public.ai_scan_results 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous update access" 
ON public.ai_scan_results 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_scan_results_updated_at
BEFORE UPDATE ON public.ai_scan_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();