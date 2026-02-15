
-- User credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert credits" ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);

-- Promo codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  credits_amount INT NOT NULL DEFAULT 5,
  max_uses INT NULL, -- null = unlimited
  current_uses INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NULL,
  description TEXT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promo codes for validation" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Promo code redemptions
CREATE TABLE public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  credits_received INT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.promo_code_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.promo_code_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit transaction log
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- positive = earned, negative = spent
  transaction_type TEXT NOT NULL, -- 'promo_code', 'scan', 'purchase', 'admin_grant'
  reference_id TEXT NULL, -- promo_code_id, scan_id, etc.
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to redeem a promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_already_used BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Niet ingelogd');
  END IF;

  SELECT * INTO v_promo FROM promo_codes WHERE UPPER(code) = UPPER(p_code) AND is_active = true;
  
  IF v_promo IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ongeldige code');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Code is verlopen');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Code is maximaal gebruikt');
  END IF;

  SELECT EXISTS(SELECT 1 FROM promo_code_redemptions WHERE user_id = v_user_id AND promo_code_id = v_promo.id) INTO v_already_used;
  
  IF v_already_used THEN
    RETURN json_build_object('success', false, 'error', 'Je hebt deze code al gebruikt');
  END IF;

  -- Insert redemption
  INSERT INTO promo_code_redemptions (user_id, promo_code_id, credits_received) VALUES (v_user_id, v_promo.id, v_promo.credits_amount);

  -- Update promo code usage
  UPDATE promo_codes SET current_uses = current_uses + 1, updated_at = now() WHERE id = v_promo.id;

  -- Upsert user credits
  INSERT INTO user_credits (user_id, balance, total_earned) VALUES (v_user_id, v_promo.credits_amount, v_promo.credits_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = user_credits.balance + v_promo.credits_amount, total_earned = user_credits.total_earned + v_promo.credits_amount, updated_at = now();

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (v_user_id, v_promo.credits_amount, 'promo_code', v_promo.id::text, 'Promocode: ' || v_promo.code);

  RETURN json_build_object('success', true, 'credits', v_promo.credits_amount);
END;
$$;

-- Trigger for auto-creating user_credits on profile creation
CREATE OR REPLACE FUNCTION public.create_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance) VALUES (NEW.user_id, 0) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_credits
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_user_credits();
