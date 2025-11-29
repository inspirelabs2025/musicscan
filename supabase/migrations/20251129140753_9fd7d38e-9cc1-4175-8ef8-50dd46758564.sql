-- Create cron job for singles batch processor (runs every minute)
SELECT cron.schedule(
  'singles-batch-processor-cron',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/singles-batch-processor',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"cron": true}'::jsonb
  ) as request_id;
  $$
);