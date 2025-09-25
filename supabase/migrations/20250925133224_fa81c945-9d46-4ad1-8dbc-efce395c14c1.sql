-- Recreate the daily news update cron job to fix potential issues
SELECT cron.unschedule('daily-news-update');

SELECT cron.schedule(
    'daily-news-update',
    '0 6 * * *',
    $$
    SELECT
        net.http_post(
            url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-news-update',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
            body:='{"trigger": "cron", "force_refresh": true}'::jsonb
        ) as request_id;
    $$
);