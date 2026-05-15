-- Defense-in-depth: drop any client write-policies (already removed, kept for safety)
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

-- DB-level idempotency for Stripe credit purchases
CREATE UNIQUE INDEX IF NOT EXISTS credit_txn_purchase_ref_uniq
  ON public.credit_transactions (reference_id)
  WHERE transaction_type = 'purchase' AND reference_id IS NOT NULL;

-- Defense-in-depth: balance can never go negative
ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_balance_nonneg;
ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_balance_nonneg CHECK (balance >= 0);