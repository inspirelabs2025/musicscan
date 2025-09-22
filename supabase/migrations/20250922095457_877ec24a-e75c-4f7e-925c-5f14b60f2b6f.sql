-- Update cron job to run at 10:30 UTC (12:30 Dutch time)
SELECT cron.unschedule('daily-email-digest-cron');

SELECT cron.schedule(
  'daily-email-digest-cron',
  '30 10 * * *', -- Every day at 10:30 UTC (12:30 Dutch time)
  $$
  SELECT
    net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-email-digest',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);