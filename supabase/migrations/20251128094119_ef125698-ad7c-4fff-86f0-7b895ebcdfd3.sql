
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily YouTube discoveries cron job at 3 AM UTC
SELECT cron.schedule(
  'daily-youtube-discoveries',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/youtube-discoveries',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{"userId": "system", "contentTypes": ["interview", "studio", "live_session", "documentary"], "artistLimit": 8}'::jsonb
  ) as request_id;
  $$
);
