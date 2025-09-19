-- Create batch processing status table for tracking batch operations
CREATE TABLE IF NOT EXISTS public.batch_processing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_batch INTEGER,
  current_items JSONB,
  failed_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.batch_processing_status ENABLE ROW LEVEL SECURITY;

-- Create policies - only authenticated users can access (admin functionality)
CREATE POLICY "Authenticated users can view batch processing status"
ON public.batch_processing_status
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create batch processing status"
ON public.batch_processing_status
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update batch processing status"
ON public.batch_processing_status
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_batch_processing_status_type_created 
ON public.batch_processing_status(process_type, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_batch_processing_status_updated_at
BEFORE UPDATE ON public.batch_processing_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();