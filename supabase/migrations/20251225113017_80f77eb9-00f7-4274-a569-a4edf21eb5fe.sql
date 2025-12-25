-- Previous attempt failed due to nested $$ quoting inside a DO block.

-- Ensure required extensions exist (install into extensions schema, not public)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create pg_cron jobs to invoke edge functions automatically (idempotent)
DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ms_album_queue_processor_5m') THEN
    PERFORM cron.schedule(
      'ms_album_queue_processor_5m',
      '*/5 * * * *',
      $cron$
      SELECT net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/album-queue-processor',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"batchSize":5}'::jsonb
      );
      $cron$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ms_batch_album_discovery_hourly') THEN
    PERFORM cron.schedule(
      'ms_batch_album_discovery_hourly',
      '0 * * * *',
      $cron$
      SELECT net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/batch-album-discovery',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInNlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"batchSize":5}'::jsonb
      );
      $cron$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ms_extract_singles_from_albums_2h') THEN
    PERFORM cron.schedule(
      'ms_extract_singles_from_albums_2h',
      '0 */2 * * *',
      $cron$
      SELECT net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/extract-singles-from-albums',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:=jsonb_build_object('time', now()::text)
      );
      $cron$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ms_singles_discovery_30m') THEN
    PERFORM cron.schedule(
      'ms_singles_discovery_30m',
      '*/30 * * * *',
      $cron$
      SELECT net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/singles-discovery-processor',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"batchSize":3}'::jsonb
      );
      $cron$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ms_daily_artist_stories_6h') THEN
    PERFORM cron.schedule(
      'ms_daily_artist_stories_6h',
      '0 */6 * * *',
      $cron$
      SELECT net.http_post(
        url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-artist-stories-generator',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
        body:='{"count":10}'::jsonb
      );
      $cron$
    );
  END IF;
END
$outer$;