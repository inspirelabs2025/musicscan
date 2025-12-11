-- Add new columns to clean_analytics for enhanced tracking
ALTER TABLE public.clean_analytics 
ADD COLUMN IF NOT EXISTS session_start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS page_load_time INTEGER,
ADD COLUMN IF NOT EXISTS scroll_depth INTEGER,
ADD COLUMN IF NOT EXISTS time_on_page INTEGER,
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS is_new_visitor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS is_bounce BOOLEAN,
ADD COLUMN IF NOT EXISTS exit_page BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_path TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clean_analytics_visitor_id ON public.clean_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_session_start ON public.clean_analytics(session_start_at);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_utm_source ON public.clean_analytics(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clean_analytics_is_new_visitor ON public.clean_analytics(is_new_visitor);
CREATE INDEX IF NOT EXISTS idx_clean_analytics_is_bounce ON public.clean_analytics(is_bounce);