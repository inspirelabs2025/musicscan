-- Create cronjob_execution_log table for centralized cronjob tracking
CREATE TABLE public.cronjob_execution_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  execution_time_ms integer,
  items_processed integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_cronjob_log_function_name ON public.cronjob_execution_log(function_name);
CREATE INDEX idx_cronjob_log_started_at ON public.cronjob_execution_log(started_at DESC);
CREATE INDEX idx_cronjob_log_status ON public.cronjob_execution_log(status);

-- Enable RLS
ALTER TABLE public.cronjob_execution_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view cronjob logs"
ON public.cronjob_execution_log
FOR SELECT
USING (is_admin(auth.uid()));

-- System/service role can insert/update logs
CREATE POLICY "System can manage cronjob logs"
ON public.cronjob_execution_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a helper function to log cronjob start
CREATE OR REPLACE FUNCTION public.log_cronjob_start(p_function_name text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.cronjob_execution_log (function_name, status, metadata)
  VALUES (p_function_name, 'running', p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create a helper function to log cronjob completion
CREATE OR REPLACE FUNCTION public.log_cronjob_complete(
  p_log_id uuid, 
  p_status text, 
  p_items_processed integer DEFAULT 0, 
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cronjob_execution_log
  SET 
    completed_at = now(),
    status = p_status,
    execution_time_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000,
    items_processed = p_items_processed,
    error_message = p_error_message,
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_log_id;
END;
$$;

-- Create a view for cronjob statistics
CREATE OR REPLACE VIEW public.cronjob_stats AS
SELECT 
  function_name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'error') as failed_runs,
  COUNT(*) FILTER (WHERE status = 'running') as running_count,
  ROUND(AVG(execution_time_ms)::numeric, 0) as avg_execution_time_ms,
  MAX(started_at) as last_run_at,
  (SELECT status FROM public.cronjob_execution_log l2 
   WHERE l2.function_name = cronjob_execution_log.function_name 
   ORDER BY started_at DESC LIMIT 1) as last_status
FROM public.cronjob_execution_log
GROUP BY function_name;