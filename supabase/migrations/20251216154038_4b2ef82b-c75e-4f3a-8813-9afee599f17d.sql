-- Create function to get queue health overview
CREATE OR REPLACE FUNCTION get_queue_health_overview()
RETURNS TABLE (
  queue_name text,
  pending bigint,
  processing bigint,
  completed bigint,
  failed bigint,
  total bigint,
  last_activity timestamptz,
  oldest_pending timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  
  -- batch_queue_items
  SELECT 
    'batch_queue_items'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM batch_queue_items
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- singles_import_queue
  SELECT 
    'singles_import_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(processed_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM singles_import_queue
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- singles_facebook_queue
  SELECT 
    'singles_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'posted'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM singles_facebook_queue
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- music_history_facebook_queue
  SELECT 
    'music_history_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'posted'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(scheduled_for) FILTER (WHERE status = 'pending')
  FROM music_history_facebook_queue
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- youtube_facebook_queue
  SELECT 
    'youtube_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'posted'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(scheduled_for) FILTER (WHERE status = 'pending')
  FROM youtube_facebook_queue
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- render_jobs
  SELECT 
    'render_jobs'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status IN ('running', 'processing')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM render_jobs
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- indexnow_queue
  SELECT 
    'indexnow_queue'::text,
    COUNT(*) FILTER (WHERE NOT processed),
    0::bigint,
    COUNT(*) FILTER (WHERE processed),
    0::bigint,
    COUNT(*),
    MAX(processed_at),
    MIN(created_at) FILTER (WHERE NOT processed)
  FROM indexnow_queue
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- discogs_import_log
  SELECT 
    'discogs_import_log'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(updated_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM discogs_import_log
  WHERE created_at > now() - interval '7 days'
  
  UNION ALL
  
  -- christmas_import_queue
  SELECT 
    'christmas_import_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*),
    MAX(processed_at),
    MIN(created_at) FILTER (WHERE status = 'pending')
  FROM christmas_import_queue
  WHERE created_at > now() - interval '7 days';
END;
$$;

-- Create function to get cronjob health stats
CREATE OR REPLACE FUNCTION get_cronjob_health_stats(p_hours integer DEFAULT 24)
RETURNS TABLE (
  function_name text,
  total_runs bigint,
  successful_runs bigint,
  failed_runs bigint,
  running_count bigint,
  avg_execution_time_ms numeric,
  last_run_at timestamptz,
  last_status text,
  success_rate numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cel.function_name,
    COUNT(*)::bigint as total_runs,
    COUNT(*) FILTER (WHERE cel.status = 'success')::bigint as successful_runs,
    COUNT(*) FILTER (WHERE cel.status = 'error')::bigint as failed_runs,
    COUNT(*) FILTER (WHERE cel.status = 'running')::bigint as running_count,
    ROUND(AVG(cel.execution_time_ms), 0) as avg_execution_time_ms,
    MAX(cel.started_at) as last_run_at,
    (SELECT cel2.status FROM cronjob_execution_log cel2 
     WHERE cel2.function_name = cel.function_name 
     ORDER BY cel2.started_at DESC LIMIT 1) as last_status,
    ROUND(
      COUNT(*) FILTER (WHERE cel.status = 'success')::numeric / 
      NULLIF(COUNT(*), 0) * 100, 1
    ) as success_rate
  FROM cronjob_execution_log cel
  WHERE cel.started_at > now() - (p_hours || ' hours')::interval
  GROUP BY cel.function_name
  ORDER BY last_run_at DESC NULLS LAST;
END;
$$;

-- Create function to get recent cronjob executions
CREATE OR REPLACE FUNCTION get_recent_cronjob_executions(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  function_name text,
  started_at timestamptz,
  completed_at timestamptz,
  status text,
  execution_time_ms integer,
  items_processed integer,
  error_message text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cel.id,
    cel.function_name,
    cel.started_at,
    cel.completed_at,
    cel.status,
    cel.execution_time_ms,
    cel.items_processed,
    cel.error_message
  FROM cronjob_execution_log cel
  ORDER BY cel.started_at DESC
  LIMIT p_limit;
END;
$$;