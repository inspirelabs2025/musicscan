-- Create table to track SEO quality issues automatically
CREATE TABLE IF NOT EXISTS public.seo_quality_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  issues TEXT[] NOT NULL DEFAULT '{}',
  content_length INTEGER DEFAULT 0,
  has_image BOOLEAN DEFAULT false,
  has_meta BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_seo_quality_issues_unresolved ON public.seo_quality_issues(is_resolved, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_quality_issues_content_type ON public.seo_quality_issues(content_type);
CREATE INDEX IF NOT EXISTS idx_seo_quality_issues_item_id ON public.seo_quality_issues(item_id);

-- Enable RLS
ALTER TABLE public.seo_quality_issues ENABLE ROW LEVEL SECURITY;

-- Admin can view all
CREATE POLICY "Admins can view SEO issues" ON public.seo_quality_issues
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access" ON public.seo_quality_issues
FOR ALL USING (true) WITH CHECK (true);

-- Create cron job to run SEO scanner daily at 05:00 UTC
SELECT cron.schedule(
  'auto-seo-quality-scanner',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/auto-seo-quality-scanner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);