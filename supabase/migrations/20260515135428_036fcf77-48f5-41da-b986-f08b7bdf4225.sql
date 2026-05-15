CREATE OR REPLACE FUNCTION public.deduct_scan_credit(p_user_id uuid)
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
  VALUES (p_user_id, -1, 'scan_usage', 'Credit gebruikt voor scan');

  RETURN true;
END;
$$;