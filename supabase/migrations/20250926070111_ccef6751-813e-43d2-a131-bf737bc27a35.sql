-- Create cron job for automatic artwork fetching
-- This will run the batch-fetch-artwork function daily at 2 AM CET
SELECT cron.schedule(
  'daily-artwork-fetch',
  '0 2 * * *', -- Daily at 2:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/batch-fetch-artwork',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"process_ai_scans": true}'::jsonb
    ) as request_id;
  $$
);