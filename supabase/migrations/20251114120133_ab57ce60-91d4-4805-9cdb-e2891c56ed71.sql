-- Create email_templates table for storing customizable email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL CHECK (template_type IN ('daily_digest', 'weekly_discussion')),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_html text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_email_templates_type_active ON public.email_templates(template_type, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view templates
CREATE POLICY "Admins can view email templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can insert templates
CREATE POLICY "Admins can insert email templates"
  ON public.email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update templates
CREATE POLICY "Admins can update email templates"
  ON public.email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete templates
CREATE POLICY "Admins can delete email templates"
  ON public.email_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_type, name, is_active, config) VALUES
(
  'daily_digest',
  'Default Daily Digest',
  true,
  '{
    "branding": {
      "companyName": "MusicScan",
      "fromEmail": "noreply@musicscan.app",
      "replyToEmail": "support@musicscan.app"
    },
    "styling": {
      "headerGradientStart": "#9b87f5",
      "headerGradientEnd": "#F97316",
      "accentColor": "#8B5CF6",
      "backgroundColor": "#f9fafb",
      "textColor": "#1f2937",
      "linkColor": "#8B5CF6"
    },
    "content": {
      "showSections": {
        "releases": true,
        "blogs": true,
        "stats": true,
        "news": true
      },
      "introText": "Welkom bij je dagelijkse MusicScan update! Ontdek de nieuwste releases, blogs en community highlights.",
      "outroText": "Bedankt voor het lezen! Blijf ontdekken en deel je muziekmomenten.",
      "ctaButtonText": "Bezoek MusicScan",
      "ctaButtonUrl": "https://musicscan.app"
    },
    "footer": {
      "footerText": "Je ontvangt deze email omdat je geabonneerd bent op MusicScan updates.",
      "socialLinks": {
        "facebook": "",
        "instagram": "",
        "twitter": ""
      },
      "unsubscribeText": "Wil je deze emails niet meer ontvangen?"
    }
  }'::jsonb
),
(
  'weekly_discussion',
  'Default Weekly Discussion',
  true,
  '{
    "branding": {
      "companyName": "MusicScan",
      "fromEmail": "noreply@musicscan.app",
      "replyToEmail": "support@musicscan.app"
    },
    "styling": {
      "headerGradientStart": "#10b981",
      "headerGradientEnd": "#3b82f6",
      "accentColor": "#10b981",
      "backgroundColor": "#ffffff",
      "textColor": "#1f2937",
      "linkColor": "#10b981"
    },
    "content": {
      "showSections": {
        "albumCover": true,
        "artistInfo": true
      },
      "headerText": "Nieuwe Wekelijkse Discussie op MusicScan Forum!",
      "ctaButtonText": "Doe Mee aan Discussie",
      "ctaButtonUrl": "https://musicscan.app/forum"
    },
    "footer": {
      "footerText": "Je ontvangt deze email omdat je geabonneerd bent op forum notificaties.",
      "socialLinks": {
        "facebook": "",
        "instagram": "",
        "twitter": ""
      },
      "unsubscribeText": "Notificaties uitschakelen?"
    }
  }'::jsonb
);