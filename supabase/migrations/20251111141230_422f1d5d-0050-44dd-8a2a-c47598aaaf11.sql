-- Create photo_batch_queue table for tracking automatic photo processing
CREATE TABLE IF NOT EXISTS public.photo_batch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'completed_with_errors', 'failed')),
  total_jobs INTEGER NOT NULL DEFAULT 10,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  current_job TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_photo_batch_queue_status ON public.photo_batch_queue(status);
CREATE INDEX IF NOT EXISTS idx_photo_batch_queue_created_at ON public.photo_batch_queue(created_at DESC);

-- Enable RLS
ALTER TABLE public.photo_batch_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own batch jobs (based on auth.uid())
-- For now, make it admin-only by allowing all authenticated users to see all batches
CREATE POLICY "Authenticated users can view all batch jobs"
  ON public.photo_batch_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can manage batch jobs
CREATE POLICY "Service role can manage batch jobs"
  ON public.photo_batch_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_photo_batch_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_photo_batch_queue_updated_at
  BEFORE UPDATE ON public.photo_batch_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photo_batch_queue_updated_at();

COMMENT ON TABLE public.photo_batch_queue IS 'Tracks automatic batch processing of uploaded photos to generate all product variants (posters, canvas, t-shirts, socks)';