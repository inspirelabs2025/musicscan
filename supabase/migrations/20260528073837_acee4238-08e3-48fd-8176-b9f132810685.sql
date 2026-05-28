
ALTER TABLE public.discogs_bulk_email_sends
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_discogs_bulk_email_sends_resend_email_id
  ON public.discogs_bulk_email_sends (resend_email_id);
