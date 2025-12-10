-- Create worker_stats table for heartbeat tracking
CREATE TABLE IF NOT EXISTS public.worker_stats (
  id TEXT PRIMARY KEY,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  polling_interval_ms INTEGER DEFAULT 5000,
  status TEXT DEFAULT 'idle',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.worker_stats ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role has full access to worker_stats"
ON public.worker_stats
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_worker_stats_last_heartbeat ON public.worker_stats(last_heartbeat DESC);

-- Create updated_at trigger
CREATE TRIGGER update_worker_stats_updated_at
  BEFORE UPDATE ON public.worker_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();