-- New signups now receive 10 starting credits instead of 0.
CREATE OR REPLACE FUNCTION public.create_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance) VALUES (NEW.user_id, 10) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;