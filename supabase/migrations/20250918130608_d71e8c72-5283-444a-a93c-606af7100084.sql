-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily news update function to run every day at 6:00 AM UTC
SELECT cron.schedule(
  'daily-news-update',
  '0 6 * * *', -- Every day at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-news-update',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEwODI1MywiZXhwIjoyMDYxNjg0MjUzfQ.drNi-a6Bmh2YCu7wMVfCz7MrIymX4fKAJOG0jWfJxNM"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);