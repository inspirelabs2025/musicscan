
-- Schedule daily music history generation at 6:00 AM UTC
SELECT cron.schedule(
  'generate-daily-music-history',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-daily-music-history',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
