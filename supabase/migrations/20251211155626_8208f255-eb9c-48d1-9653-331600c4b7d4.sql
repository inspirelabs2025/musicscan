-- Add comprehensive visitor data columns to clean_analytics
ALTER TABLE public.clean_analytics
ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
ADD COLUMN IF NOT EXISTS viewport_width INTEGER,
ADD COLUMN IF NOT EXISTS viewport_height INTEGER,
ADD COLUMN IF NOT EXISTS color_depth INTEGER,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS touch_support BOOLEAN,
ADD COLUMN IF NOT EXISTS connection_type TEXT,
ADD COLUMN IF NOT EXISTS device_memory INTEGER,
ADD COLUMN IF NOT EXISTS cpu_cores INTEGER,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS copy_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS print_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dns_time INTEGER,
ADD COLUMN IF NOT EXISTS connect_time INTEGER,
ADD COLUMN IF NOT EXISTS ttfb INTEGER,
ADD COLUMN IF NOT EXISTS dom_interactive INTEGER,
ADD COLUMN IF NOT EXISTS fully_loaded INTEGER,
ADD COLUMN IF NOT EXISTS ad_blocker_detected BOOLEAN,
ADD COLUMN IF NOT EXISTS do_not_track BOOLEAN,
ADD COLUMN IF NOT EXISTS cookies_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS java_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS online_status BOOLEAN,
ADD COLUMN IF NOT EXISTS battery_level INTEGER,
ADD COLUMN IF NOT EXISTS battery_charging BOOLEAN,
ADD COLUMN IF NOT EXISTS webgl_vendor TEXT,
ADD COLUMN IF NOT EXISTS webgl_renderer TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clean_analytics_platform ON public.clean_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_language ON public.clean_analytics(language);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_timezone ON public.clean_analytics(timezone);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_connection ON public.clean_analytics(connection_type);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_touch ON public.clean_analytics(touch_support);