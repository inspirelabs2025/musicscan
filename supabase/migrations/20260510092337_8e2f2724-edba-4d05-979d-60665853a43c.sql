-- Guest chat usage tracking (anonymous users on /ai-scan-v2)
CREATE TABLE IF NOT EXISTS public.guest_chat_usage (
  fingerprint text PRIMARY KEY,
  ip_address text,
  chat_count integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_chat_usage ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role (edge function) reads/writes.

CREATE INDEX IF NOT EXISTS idx_guest_chat_usage_ip ON public.guest_chat_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_chat_usage_last_seen ON public.guest_chat_usage(last_seen_at DESC);

-- Atomic increment RPC; returns new count
CREATE OR REPLACE FUNCTION public.increment_guest_chat(
  p_fingerprint text,
  p_ip text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.guest_chat_usage (fingerprint, ip_address, chat_count, first_seen_at, last_seen_at)
  VALUES (p_fingerprint, p_ip, 1, now(), now())
  ON CONFLICT (fingerprint) DO UPDATE
    SET chat_count = public.guest_chat_usage.chat_count + 1,
        last_seen_at = now(),
        ip_address = COALESCE(EXCLUDED.ip_address, public.guest_chat_usage.ip_address)
  RETURNING chat_count INTO v_count;
  RETURN v_count;
END;
$$;