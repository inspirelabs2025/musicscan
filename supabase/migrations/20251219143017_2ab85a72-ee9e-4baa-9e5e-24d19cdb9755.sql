-- Verwijder de oude minuut-cronjob
SELECT cron.unschedule('backfill-country-codes-every-minute');

-- Maak een nieuwe uur-cronjob
SELECT cron.schedule(
  'backfill-country-codes-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/backfill-country-codes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);