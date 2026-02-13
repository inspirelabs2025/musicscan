
-- Table to log all Lovable AI Gateway calls
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd NUMERIC(10,6),
  has_images BOOLEAN DEFAULT false,
  image_count INTEGER DEFAULT 0,
  context_info JSONB DEFAULT '{}',
  duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view AI usage logs"
  ON public.ai_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Edge functions insert via service role (no RLS needed for insert)
CREATE POLICY "Service role can insert AI usage logs"
  ON public.ai_usage_log
  FOR INSERT
  WITH CHECK (true);

-- Index for dashboard queries
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log (created_at DESC);
CREATE INDEX idx_ai_usage_log_function ON public.ai_usage_log (function_name);

-- RPC for aggregated stats
CREATE OR REPLACE FUNCTION public.get_ai_usage_stats(
  start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_calls', COUNT(*),
    'total_tokens', COALESCE(SUM(total_tokens), 0),
    'total_cost_usd', COALESCE(SUM(estimated_cost_usd), 0),
    'calls_with_images', COUNT(*) FILTER (WHERE has_images = true),
    'avg_duration_ms', COALESCE(AVG(duration_ms)::INTEGER, 0),
    'by_function', (
      SELECT json_agg(row_to_json(f))
      FROM (
        SELECT function_name, 
               COUNT(*) as call_count,
               COALESCE(SUM(total_tokens), 0) as tokens,
               COALESCE(SUM(estimated_cost_usd), 0) as cost_usd,
               COALESCE(AVG(duration_ms)::INTEGER, 0) as avg_ms
        FROM public.ai_usage_log
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY function_name
        ORDER BY cost_usd DESC
      ) f
    ),
    'by_model', (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT model,
               COUNT(*) as call_count,
               COALESCE(SUM(total_tokens), 0) as tokens,
               COALESCE(SUM(estimated_cost_usd), 0) as cost_usd
        FROM public.ai_usage_log
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY model
        ORDER BY cost_usd DESC
      ) m
    ),
    'daily_breakdown', (
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT DATE(created_at) as date,
               COUNT(*) as calls,
               COALESCE(SUM(total_tokens), 0) as tokens,
               COALESCE(SUM(estimated_cost_usd), 0) as cost_usd
        FROM public.ai_usage_log
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ) d
    )
  ) INTO result
  FROM public.ai_usage_log
  WHERE created_at >= start_date AND created_at <= end_date;

  RETURN result;
END;
$$;
