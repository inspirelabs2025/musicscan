-- Fix ms_batch_album_discovery_hourly cron job (previous migration accidentally inserted a malformed JWT)
DO $outer$
DECLARE
  v_job_id integer;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'ms_batch_album_discovery_hourly' LIMIT 1;
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'ms_batch_album_discovery_hourly',
    '0 * * * *',
    $cron$
    SELECT net.http_post(
      url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/batch-album-discovery',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
      body:='{"batchSize":5}'::jsonb
    );
    $cron$
  );
END
$outer$;