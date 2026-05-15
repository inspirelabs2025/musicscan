CREATE OR REPLACE FUNCTION public.purchase_credits(
  p_user_id uuid,
  p_amount integer,
  p_reference_id text,
  p_description text DEFAULT NULL
)
RETURNS TABLE(fulfilled boolean, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_balance integer;
BEGIN
  BEGIN
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, reference_id, description)
    VALUES (p_user_id, p_amount, 'purchase', p_reference_id,
            COALESCE(p_description, 'Aankoop: ' || p_amount || ' credits'));
  EXCEPTION WHEN unique_violation THEN
    SELECT uc.balance INTO v_balance FROM public.user_credits uc WHERE uc.user_id = p_user_id;
    RETURN QUERY SELECT false, COALESCE(v_balance, 0);
    RETURN;
  END;

  INSERT INTO public.user_credits (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_credits.balance + EXCLUDED.balance,
        total_earned = public.user_credits.total_earned + EXCLUDED.total_earned,
        updated_at = now()
  RETURNING user_credits.balance INTO v_balance;

  RETURN QUERY SELECT true, v_balance;
END;
$$;