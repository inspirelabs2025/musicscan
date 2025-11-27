-- Create cronjob for daily artist stories generator (runs at 7:00 AM daily)
SELECT cron.schedule(
  'daily-artist-stories-generator',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-artist-stories-generator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{"count": 5}'::jsonb
  ) as request_id;
  $$
);