
-- Lock down client-side writes on credit tables.
-- Edge functions use the service role and bypass RLS, so legitimate flows
-- (webhook, verify-credit-purchase, redeem_promo_code RPC) keep working.

DROP POLICY IF EXISTS "System can update credits" ON public.user_credits;
DROP POLICY IF EXISTS "System can insert credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

-- SELECT policies remain so users can still read their own balance & history.
