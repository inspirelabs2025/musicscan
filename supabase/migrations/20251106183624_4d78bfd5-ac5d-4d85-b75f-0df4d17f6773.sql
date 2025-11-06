-- Fix ambiguous column error in get_current_usage by avoiding reference to output column names in ON CONFLICT target
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id uuid)
RETURNS TABLE(
  ai_scans_used integer,
  ai_chat_used integer,
  bulk_uploads_used integer,
  period_start date,
  period_end date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_period_start date;
  current_period_end date;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', CURRENT_DATE)::date;
  current_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;

  -- Get or create usage record for current period
  INSERT INTO public.usage_tracking (user_id, period_start, period_end)
  VALUES (p_user_id, current_period_start, current_period_end)
  ON CONFLICT DO NOTHING;  -- Avoid referencing column names that shadow OUT params

  -- Return current usage with fully qualified column references
  RETURN QUERY
  SELECT 
    ut.ai_scans_used,
    ut.ai_chat_used, 
    ut.bulk_uploads_used,
    ut.period_start,
    ut.period_end
  FROM public.usage_tracking ut
  WHERE ut.user_id = p_user_id 
    AND ut.period_start = current_period_start;
END;
$$;