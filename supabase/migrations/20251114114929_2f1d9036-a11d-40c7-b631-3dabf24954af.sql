-- Create email_logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('daily_digest', 'weekly_discussion', 'test', 'other')),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'pending')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  resend_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create materialized view for notification statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.notification_stats AS
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week_count,
  now() as last_updated
FROM public.notifications
GROUP BY type;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_notification_stats_type ON public.notification_stats(type);

-- Function to refresh notification stats
CREATE OR REPLACE FUNCTION public.refresh_notification_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.notification_stats;
END;
$$;

-- Grant access to authenticated users for notification_stats
GRANT SELECT ON public.notification_stats TO authenticated;