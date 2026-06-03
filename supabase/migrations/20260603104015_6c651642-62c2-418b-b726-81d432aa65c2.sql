-- Templates
CREATE TABLE public.email_center_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_center_templates TO authenticated;
GRANT ALL ON public.email_center_templates TO service_role;

ALTER TABLE public.email_center_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email center templates"
ON public.email_center_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Campaigns
CREATE TABLE public.email_center_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_center_campaigns TO authenticated;
GRANT ALL ON public.email_center_campaigns TO service_role;

ALTER TABLE public.email_center_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email center campaigns"
ON public.email_center_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sends
CREATE TABLE public.email_center_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_center_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_center_sends_campaign ON public.email_center_sends(campaign_id);
CREATE INDEX idx_email_center_sends_status ON public.email_center_sends(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_center_sends TO authenticated;
GRANT ALL ON public.email_center_sends TO service_role;

ALTER TABLE public.email_center_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email center sends"
ON public.email_center_sends FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger for templates
CREATE TRIGGER trg_email_center_templates_updated
BEFORE UPDATE ON public.email_center_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();