-- Drop and recreate claim_next_render_job with input_url support
DROP FUNCTION IF EXISTS public.claim_next_render_job(text, text[]);

CREATE FUNCTION public.claim_next_render_job(
  p_worker_id text,
  p_job_types text[] DEFAULT NULL
)
RETURNS jsonb
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

  -- Build result JSON with input_url at top level for worker compatibility
  v_result := jsonb_build_object(
    'id', v_job.id,
    'type', COALESCE(v_job.type, v_job.source_type),
    'input_url', v_job.image_url,
    'image_url', v_job.image_url,
    'artist', v_job.artist,
    'title', v_job.title,
    'payload', COALESCE(v_job.payload, jsonb_build_object(
      'image_url', v_job.image_url,
      'input_url', v_job.image_url,
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