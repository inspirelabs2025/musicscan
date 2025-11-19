-- Create facebook_sync_log table for tracking product sync status
CREATE TABLE IF NOT EXISTS public.facebook_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_details JSONB,
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view sync logs
CREATE POLICY "Admins can view sync logs"
  ON public.facebook_sync_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can insert sync logs
CREATE POLICY "Admins can insert sync logs"
  ON public.facebook_sync_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX idx_facebook_sync_log_status ON public.facebook_sync_log(status);
CREATE INDEX idx_facebook_sync_log_started_at ON public.facebook_sync_log(sync_started_at DESC);