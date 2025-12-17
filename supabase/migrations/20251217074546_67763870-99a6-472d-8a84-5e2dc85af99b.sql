-- Add cron job for post-scheduled-youtube to run hourly between 09:00-21:00 UTC
SELECT cron.schedule(
  'post-scheduled-youtube-cron',
  '0 9-21 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-youtube',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);