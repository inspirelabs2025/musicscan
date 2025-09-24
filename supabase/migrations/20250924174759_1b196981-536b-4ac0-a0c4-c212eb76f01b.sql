-- Fix ambiguous column reference in get_current_usage function
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id uuid)
 RETURNS TABLE(ai_scans_used integer, ai_chat_used integer, bulk_uploads_used integer, period_start date, period_end date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Return current usage with fully qualified column references
  RETURN QUERY
  SELECT 
    usage_tracking.ai_scans_used,
    usage_tracking.ai_chat_used, 
    usage_tracking.bulk_uploads_used,
    usage_tracking.period_start,
    usage_tracking.period_end
  FROM public.usage_tracking
  WHERE usage_tracking.user_id = p_user_id 
    AND usage_tracking.period_start = current_period_start;
END;
$function$;