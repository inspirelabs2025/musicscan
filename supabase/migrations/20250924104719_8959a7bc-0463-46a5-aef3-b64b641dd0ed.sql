-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule AI artwork backfill job to run every 10 minutes
SELECT cron.schedule(
  'ai-artwork-backfill',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/batch-fetch-artwork',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{"process_ai_scans": true}'::jsonb
  ) as request_id;
  $$
);