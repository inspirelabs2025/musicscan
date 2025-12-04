-- Enable RLS op de twee tabellen (policies bestaan al)
ALTER TABLE public.sitemap_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_generation_stats ENABLE ROW LEVEL SECURITY;

-- Recreate cronjob_stats met security_invoker (is een normale view)
DROP VIEW IF EXISTS public.cronjob_stats CASCADE;
CREATE VIEW public.cronjob_stats 
WITH (security_invoker = on) AS
SELECT 
  function_name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  COUNT(*) FILTER (WHERE status = 'running') as running_count,
  MAX(started_at) as last_run_at,
  MAX(CASE WHEN status IN ('completed', 'failed') THEN status END) as last_status,
  AVG(execution_time_ms) as avg_execution_time_ms
FROM public.cronjob_execution_log
GROUP BY function_name;