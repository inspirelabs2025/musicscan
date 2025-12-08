-- Create render_jobs table for external worker processing
CREATE TABLE public.render_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url TEXT NOT NULL,
  output_url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('blog_post', 'music_story', 'single')),
  source_id UUID,
  artist TEXT,
  title TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  worker_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient polling by worker
CREATE INDEX idx_render_jobs_pending ON public.render_jobs (status, priority DESC, created_at ASC) WHERE status = 'pending';
CREATE INDEX idx_render_jobs_source ON public.render_jobs (source_type, source_id);

-- Enable RLS
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage render jobs" ON public.render_jobs
  FOR ALL USING (public.is_admin(auth.uid()));

-- Service role can do everything (for edge functions and worker)
CREATE POLICY "Service role full access" ON public.render_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_render_jobs_updated_at
  BEFORE UPDATE ON public.render_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function for worker to claim a job atomically
CREATE OR REPLACE FUNCTION public.claim_render_job(p_worker_id TEXT)
RETURNS TABLE (
  job_id UUID,
  image_url TEXT,
  source_type TEXT,
  source_id UUID,
  artist TEXT,
  title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  claimed_job RECORD;
BEGIN
  -- Atomically claim the highest priority pending job
  UPDATE public.render_jobs
  SET 
    status = 'processing',
    worker_id = p_worker_id,
    started_at = now(),
    attempts = attempts + 1,
    updated_at = now()
  WHERE id = (
    SELECT id FROM public.render_jobs
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    id, 
    render_jobs.image_url, 
    render_jobs.source_type, 
    render_jobs.source_id, 
    render_jobs.artist, 
    render_jobs.title
  INTO claimed_job;
  
  IF claimed_job.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      claimed_job.id,
      claimed_job.image_url,
      claimed_job.source_type,
      claimed_job.source_id,
      claimed_job.artist,
      claimed_job.title;
  END IF;
END;
$$;

-- Function to complete a job
CREATE OR REPLACE FUNCTION public.complete_render_job(
  p_job_id UUID,
  p_output_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.render_jobs
  SET 
    status = 'completed',
    output_url = p_output_url,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- Function to fail a job
CREATE OR REPLACE FUNCTION public.fail_render_job(
  p_job_id UUID,
  p_error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.render_jobs
  SET 
    status = CASE 
      WHEN attempts >= max_attempts THEN 'failed'
      ELSE 'pending'
    END,
    error_message = p_error_message,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;