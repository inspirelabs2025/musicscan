-- Fix search path for security compliance
CREATE OR REPLACE FUNCTION cleanup_stuck_batch_processes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark batches as failed if they've been running for more than 10 minutes without updates
  UPDATE batch_processing_status 
  SET status = 'failed', 
      updated_at = now()
  WHERE status = 'running' 
    AND updated_at < now() - interval '10 minutes';
END;
$$;