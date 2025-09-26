-- Update the weekly forum discussions cronjob to run on Fridays at 10:00 CET (08:00 UTC)
SELECT cron.unschedule('weekly-forum-discussions');

SELECT cron.schedule(
  'weekly-forum-discussions',
  '0 8 * * 5', -- Every Friday at 08:00 UTC (10:00 CET)
  $$
  SELECT
    net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/weekly-forum-discussions',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);