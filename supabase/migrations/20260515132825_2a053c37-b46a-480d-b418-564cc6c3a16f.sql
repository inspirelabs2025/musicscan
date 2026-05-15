-- Update check_usage_limit so ai_chat (in addition to ai_scans) falls through to credits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id uuid,
  p_usage_type text
)
RETURNS TABLE(can_use boolean, current_usage integer, limit_amount integer, plan_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_plan record;
  current_usage_record record;
  usage_limit integer;
  current_count integer := 0;
  user_credit_balance integer := 0;
BEGIN
  SELECT sp.* INTO user_plan
  FROM public.subscription_plans sp
  LEFT JOIN public.user_subscriptions us ON sp.id = us.plan_id
  WHERE (us.user_id = p_user_id AND us.status = 'active')
     OR (us.user_id IS NULL AND sp.slug = 'free')
  ORDER BY us.created_at DESC NULLS LAST
  LIMIT 1;

  IF user_plan IS NULL THEN
    SELECT * INTO user_plan FROM public.subscription_plans WHERE slug = 'free';
  END IF;

  SELECT * INTO current_usage_record FROM public.get_current_usage(p_user_id);

  SELECT COALESCE(uc.balance, 0) INTO user_credit_balance
  FROM public.user_credits uc
  WHERE uc.user_id = p_user_id;

  IF p_usage_type = 'ai_scans' THEN
    usage_limit := user_plan.ai_scans_limit;
    current_count := COALESCE(current_usage_record.ai_scans_used, 0);
  ELSIF p_usage_type = 'ai_chat' THEN
    usage_limit := user_plan.ai_chat_limit;
    current_count := COALESCE(current_usage_record.ai_chat_used, 0);
  ELSIF p_usage_type = 'bulk_uploads' THEN
    usage_limit := user_plan.bulk_upload_limit;
    current_count := COALESCE(current_usage_record.bulk_uploads_used, 0);
  END IF;

  -- ai_scans and ai_chat: allow if within plan limit OR has credits remaining
  IF p_usage_type IN ('ai_scans', 'ai_chat') THEN
    RETURN QUERY SELECT
      (usage_limit IS NULL OR current_count < usage_limit OR user_credit_balance > 0) as can_use,
      current_count as current_usage,
      usage_limit as limit_amount,
      user_plan.name as plan_name;
  ELSE
    RETURN QUERY SELECT
      (usage_limit IS NULL OR current_count < usage_limit) as can_use,
      current_count as current_usage,
      usage_limit as limit_amount,
      user_plan.name as plan_name;
  END IF;
END;
$$;

-- Atomic chat-credit deduction (no log entry written if no row updated)
CREATE OR REPLACE FUNCTION public.deduct_chat_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.user_credits
     SET balance = balance - 1,
         total_spent = total_spent + 1,
         updated_at = now()
   WHERE user_id = p_user_id
     AND balance > 0
   RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'chat_usage', 'Credit gebruikt voor chat');

  RETURN true;
END;
$$;