-- Create matrix_scans table for CD Matrix Enhancer feature
CREATE TABLE public.matrix_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Images
  original_image_url TEXT NOT NULL,
  enhanced_image_url TEXT,
  ocr_layer_url TEXT,
  
  -- OCR Results
  ocr_text_raw TEXT,
  ocr_text_clean TEXT,
  ocr_confidence NUMERIC,
  ocr_layer_used TEXT, -- 'normal' or 'inverted'
  
  -- Processing Parameters
  params_json JSONB DEFAULT '{}',
  roi_json JSONB, -- Ring detection result
  
  -- Timings
  processing_time_ms INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending',
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matrix_scans ENABLE ROW LEVEL SECURITY;

-- Users can view their own scans
CREATE POLICY "Users can view own matrix scans" 
ON public.matrix_scans 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own matrix scans" 
ON public.matrix_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans
CREATE POLICY "Users can update own matrix scans" 
ON public.matrix_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own matrix scans" 
ON public.matrix_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for user lookups
CREATE INDEX idx_matrix_scans_user_id ON public.matrix_scans(user_id);
CREATE INDEX idx_matrix_scans_created_at ON public.matrix_scans(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_matrix_scans_updated_at
BEFORE UPDATE ON public.matrix_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();