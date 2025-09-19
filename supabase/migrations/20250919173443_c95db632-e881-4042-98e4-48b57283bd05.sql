-- Reset stuck batch processing status and add timeout detection
UPDATE batch_processing_status 
SET status = 'failed', 
    updated_at = now(),
    error_details = jsonb_build_object(
      'error', 'Batch was stuck in running state - auto-recovered',
      'recovered_at', now()
    )
WHERE status = 'running' 
  AND updated_at < now() - interval '10 minutes';

-- Add function to automatically cleanup stuck batches
CREATE OR REPLACE FUNCTION cleanup_stuck_batch_processes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark batches as failed if they've been running for more than 10 minutes without updates
  UPDATE batch_processing_status 
  SET status = 'failed', 
      updated_at = now(),
      error_details = COALESCE(error_details, '{}'::jsonb) || jsonb_build_object(
        'auto_cleanup', true,
        'cleanup_reason', 'Batch stuck for more than 10 minutes',
        'cleaned_up_at', now()
      )
  WHERE status = 'running' 
    AND updated_at < now() - interval '10 minutes';
END;
$$;