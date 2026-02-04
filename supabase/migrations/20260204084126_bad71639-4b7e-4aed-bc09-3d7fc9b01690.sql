-- Create matrix_corrections table for storing user corrections
-- This serves as training data to improve future AI OCR accuracy

CREATE TABLE public.matrix_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.ai_scan_results(id) ON DELETE CASCADE,
  original_matrix TEXT NOT NULL,
  corrected_matrix TEXT NOT NULL,
  character_corrections JSONB DEFAULT '[]',
  media_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matrix_corrections ENABLE ROW LEVEL SECURITY;

-- Users can insert their own corrections
CREATE POLICY "Users can insert their own corrections"
  ON public.matrix_corrections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own corrections
CREATE POLICY "Users can view their own corrections"
  ON public.matrix_corrections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all corrections for training purposes
CREATE POLICY "Admins can view all corrections"
  ON public.matrix_corrections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for efficient queries
CREATE INDEX idx_matrix_corrections_scan_id ON public.matrix_corrections(scan_id);
CREATE INDEX idx_matrix_corrections_user_id ON public.matrix_corrections(user_id);
CREATE INDEX idx_matrix_corrections_media_type ON public.matrix_corrections(media_type);

-- Add comment for documentation
COMMENT ON TABLE public.matrix_corrections IS 'Stores user corrections to AI-detected matrix numbers for training data collection';