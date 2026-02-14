
-- Table to track scan usage per IP/fingerprint
CREATE TABLE public.scan_rate_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,
  user_id UUID,
  scan_type TEXT NOT NULL DEFAULT 'photo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_scan_rate_ip_date ON public.scan_rate_tracking (ip_address, created_at);
CREATE INDEX idx_scan_rate_fingerprint_date ON public.scan_rate_tracking (device_fingerprint, created_at);
CREATE INDEX idx_scan_rate_user_date ON public.scan_rate_tracking (user_id, created_at);

-- Enable RLS
ALTER TABLE public.scan_rate_tracking ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admins can read scan_rate_tracking"
  ON public.scan_rate_tracking FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Edge functions insert via service role, no insert policy needed for anon

-- Table to log abuse detections
CREATE TABLE public.abuse_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,
  user_ids UUID[] DEFAULT '{}',
  scan_count INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 10,
  detection_type TEXT NOT NULL, -- 'ip_limit', 'fingerprint_limit', 'multi_account'
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abuse_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abuse_detections"
  ON public.abuse_detections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RPC to check and track scan usage (called by edge functions with service role)
CREATE OR REPLACE FUNCTION public.check_scan_rate(
  p_ip TEXT,
  p_fingerprint TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_scan_type TEXT DEFAULT 'photo',
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_ip_count INTEGER;
  v_fp_count INTEGER;
  v_is_over_limit BOOLEAN := false;
  v_detection_type TEXT;
BEGIN
  -- Count scans from this IP today
  SELECT COUNT(*) INTO v_ip_count
  FROM scan_rate_tracking
  WHERE ip_address = p_ip
    AND created_at > now() - interval '24 hours';

  -- Count scans from this fingerprint today (if provided)
  IF p_fingerprint IS NOT NULL AND p_fingerprint != '' THEN
    SELECT COUNT(*) INTO v_fp_count
    FROM scan_rate_tracking
    WHERE device_fingerprint = p_fingerprint
      AND created_at > now() - interval '24 hours';
  ELSE
    v_fp_count := 0;
  END IF;

  -- Record this scan
  INSERT INTO scan_rate_tracking (ip_address, device_fingerprint, user_id, scan_type)
  VALUES (p_ip, p_fingerprint, p_user_id, p_scan_type);

  -- Check limits
  IF v_ip_count >= p_daily_limit THEN
    v_is_over_limit := true;
    v_detection_type := 'ip_limit';
  ELSIF v_fp_count >= p_daily_limit THEN
    v_is_over_limit := true;
    v_detection_type := 'fingerprint_limit';
  END IF;

  -- Log abuse detection + admin alert
  IF v_is_over_limit THEN
    INSERT INTO abuse_detections (ip_address, device_fingerprint, scan_count, daily_limit, detection_type, user_ids)
    VALUES (
      p_ip, 
      p_fingerprint, 
      GREATEST(v_ip_count, v_fp_count) + 1,
      p_daily_limit,
      v_detection_type,
      CASE WHEN p_user_id IS NOT NULL THEN ARRAY[p_user_id] ELSE '{}' END
    );

    -- Create admin alert
    INSERT INTO admin_alerts (alert_type, message, source_function, metadata)
    VALUES (
      'abuse_detected',
      'Mogelijk misbruik gedetecteerd: ' || GREATEST(v_ip_count, v_fp_count) + 1 || ' scans van IP ' || p_ip,
      'check_scan_rate',
      jsonb_build_object(
        'ip', p_ip,
        'fingerprint', p_fingerprint,
        'count', GREATEST(v_ip_count, v_fp_count) + 1,
        'type', v_detection_type
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'ip_count', v_ip_count + 1,
    'fp_count', v_fp_count + 1,
    'over_limit', v_is_over_limit,
    'daily_limit', p_daily_limit
  );
END;
$$;
