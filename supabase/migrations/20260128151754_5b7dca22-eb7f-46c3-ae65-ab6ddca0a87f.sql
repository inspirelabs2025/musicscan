-- Schedule hourly backfill for scan-to-release linking
select
cron.schedule(
  'backfill-scan-releases-hourly',
  '15 * * * *',
  $$
  select
    net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/backfill-scan-releases',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"batch_size": 100}'::jsonb
    ) as request_id;
  $$
);