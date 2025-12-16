-- =====================================================
-- 1. RESET FAILED SINGLES QUEUE (760 items)
-- =====================================================
UPDATE singles_import_queue 
SET status = 'pending', 
    attempts = 0,
    error_message = NULL,
    updated_at = NOW()
WHERE status = 'failed';

-- =====================================================
-- 2. RESET STUCK PHOTO BATCH (processing > 1 day)
-- =====================================================
UPDATE photo_batch_queue 
SET status = 'failed',
    updated_at = NOW()
WHERE status = 'processing' 
AND updated_at < NOW() - INTERVAL '1 day';

-- =====================================================
-- 3. CREATE schedule-youtube-posts CRON JOB
-- Queue YouTube discoveries to Facebook queue daily
-- =====================================================
SELECT cron.schedule(
  'schedule-youtube-posts',
  '10 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-youtube-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- =====================================================
-- 4. ENSURE top2000-auto-processor CRON EXISTS
-- =====================================================
SELECT cron.schedule(
  'top2000-auto-processor',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/top2000-auto-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);