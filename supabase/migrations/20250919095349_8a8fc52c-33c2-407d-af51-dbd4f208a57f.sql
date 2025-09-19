-- Create cron job to run price collection daily
SELECT cron.schedule(
  'daily-price-collection',
  '0 6 * * *', -- Every day at 6 AM
  $$
  SELECT
    net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/collect-price-history',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);