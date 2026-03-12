CREATE TABLE public.scan_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  function_name text NOT NULL,
  status text NOT NULL DEFAULT 'started',
  artist text,
  title text,
  media_type text,
  image_count integer DEFAULT 0,
  duration_ms integer,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  discogs_id integer,
  ip_address text
);

CREATE INDEX idx_scan_activity_log_created_at ON public.scan_activity_log(created_at DESC);
CREATE INDEX idx_scan_activity_log_user_id ON public.scan_activity_log(user_id);
CREATE INDEX idx_scan_activity_log_action_type ON public.scan_activity_log(action_type);

ALTER TABLE public.scan_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read scan activity" ON public.scan_activity_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert scan activity" ON public.scan_activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can see own scan activity" ON public.scan_activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());