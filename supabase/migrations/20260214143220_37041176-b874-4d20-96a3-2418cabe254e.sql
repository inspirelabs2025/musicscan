-- Admin alerts table for credit warnings and other system alerts
CREATE TABLE public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'credit_depleted', 'credit_warning', 'rate_limit'
  source_function TEXT, -- which edge function triggered the alert
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can read/manage alerts
CREATE POLICY "Admins can manage alerts"
  ON public.admin_alerts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for quick unread alert queries
CREATE INDEX idx_admin_alerts_unread ON public.admin_alerts (is_read, created_at DESC);

-- Deduplicate: don't insert if same alert_type from same source in last hour
CREATE OR REPLACE FUNCTION public.insert_admin_alert_if_new(
  p_alert_type TEXT,
  p_source_function TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if no alert of same type+source in last hour
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_alerts
    WHERE alert_type = p_alert_type
      AND source_function = p_source_function
      AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.admin_alerts (alert_type, source_function, message, metadata)
    VALUES (p_alert_type, p_source_function, p_message, p_metadata);
  END IF;
END;
$$;