CREATE TABLE public.discogs_bulk_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html_content text NOT NULL,
  language text NOT NULL DEFAULT 'nl',
  country_filter text DEFAULT 'all',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.discogs_bulk_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.discogs_bulk_email_campaigns(id) ON DELETE CASCADE,
  buyer_email text NOT NULL,
  buyer_username text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discogs_bulk_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discogs_bulk_email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access campaigns" ON public.discogs_bulk_email_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access sends" ON public.discogs_bulk_email_sends
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bulk_email_sends_campaign ON public.discogs_bulk_email_sends(campaign_id);
CREATE INDEX idx_bulk_email_sends_status ON public.discogs_bulk_email_sends(status);