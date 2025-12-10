-- Add missing columns to existing render_jobs table
ALTER TABLE public.render_jobs 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS result JSONB,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status column to support new statuses
ALTER TABLE public.render_jobs DROP CONSTRAINT IF EXISTS render_jobs_status_check;
ALTER TABLE public.render_jobs ADD CONSTRAINT render_jobs_status_check 
  CHECK (status IN ('pending', 'running', 'done', 'error', 'processing', 'completed', 'failed'));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON public.render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_type ON public.render_jobs(type);
CREATE INDEX IF NOT EXISTS idx_render_jobs_priority_created ON public.render_jobs(priority DESC, created_at ASC);

-- Drop and recreate the claim function with updated logic
DROP FUNCTION IF EXISTS public.claim_next_render_job(text, text[]);
CREATE OR REPLACE FUNCTION public.claim_next_render_job(p_worker_id TEXT DEFAULT NULL, p_job_types TEXT[] DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job render_jobs%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Select and lock one pending job atomically
  SELECT * INTO v_job
  FROM render_jobs
  WHERE status IN ('pending')
    AND (p_job_types IS NULL OR type = ANY(p_job_types))
    AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
  ORDER BY priority DESC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_job.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Update the job to running status
  UPDATE render_jobs
  SET 
    status = 'running',
    worker_id = p_worker_id,
    locked_at = now(),
    started_at = COALESCE(started_at, now()),
    attempts = attempts + 1,
    updated_at = now()
  WHERE id = v_job.id;

  -- Build result JSON
  v_result := jsonb_build_object(
    'id', v_job.id,
    'type', COALESCE(v_job.type, v_job.source_type),
    'payload', COALESCE(v_job.payload, jsonb_build_object(
      'image_url', v_job.image_url,
      'artist', v_job.artist,
      'title', v_job.title,
      'source_id', v_job.source_id
    )),
    'priority', v_job.priority,
    'attempts', v_job.attempts + 1,
    'created_at', v_job.created_at
  );

  RETURN v_result;
END;
$$;

-- Function to update job status
CREATE OR REPLACE FUNCTION public.update_render_job_status(
  p_job_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE render_jobs
  SET 
    status = p_status,
    result = COALESCE(p_result, result),
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('done', 'error', 'completed', 'failed') THEN now() ELSE completed_at END,
    locked_at = NULL,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_render_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_render_jobs_updated_at ON public.render_jobs;
CREATE TRIGGER update_render_jobs_updated_at
  BEFORE UPDATE ON public.render_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_render_jobs_updated_at();