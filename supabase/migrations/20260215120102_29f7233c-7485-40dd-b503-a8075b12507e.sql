
-- Create add_user_credits function for credit purchases
CREATE OR REPLACE FUNCTION public.add_user_credits(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_credits.balance + p_amount,
    total_earned = user_credits.total_earned + p_amount,
    updated_at = now();
END;
$$;

-- Update check_usage_limit to also consider user credits
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
  -- Get user's current subscription plan (default to FREE)
  SELECT sp.* INTO user_plan
  FROM public.subscription_plans sp
  LEFT JOIN public.user_subscriptions us ON sp.id = us.plan_id 
  WHERE (us.user_id = p_user_id AND us.status = 'active')
     OR (us.user_id IS NULL AND sp.slug = 'free')
  ORDER BY us.created_at DESC NULLS LAST
  LIMIT 1;
  
  -- If no plan found, default to FREE
  IF user_plan IS NULL THEN
    SELECT * INTO user_plan FROM public.subscription_plans WHERE slug = 'free';
  END IF;
  
  -- Get current usage
  SELECT * INTO current_usage_record FROM public.get_current_usage(p_user_id);
  
  -- Get user credit balance
  SELECT COALESCE(uc.balance, 0) INTO user_credit_balance
  FROM public.user_credits uc
  WHERE uc.user_id = p_user_id;
  
  -- Determine usage limit and current count based on type
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
  
  -- For ai_scans: allow if within plan limit OR has credits remaining
  -- Credits extend beyond the plan limit
  IF p_usage_type = 'ai_scans' THEN
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

-- Create function to deduct a credit (called after scan when over plan limit)
CREATE OR REPLACE FUNCTION public.deduct_scan_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance FROM public.user_credits WHERE user_id = p_user_id;
  
  IF current_balance IS NULL OR current_balance <= 0 THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_credits 
  SET balance = balance - 1, 
      total_spent = total_spent + 1,
      updated_at = now()
  WHERE user_id = p_user_id AND balance > 0;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'scan_usage', 'Credit gebruikt voor scan');
  
  RETURN true;
END;
$$;
