-- ALLEEN Facebook posting jobs - minimale set met conservatieve schedules
-- Geen AI/generation jobs, alleen posten naar Facebook

-- 1. YouTube posts naar Facebook - 5x per dag (9u, 12u, 15u, 18u, 21u UTC)
SELECT cron.schedule(
  'post-youtube-facebook',
  '0 9,12,15,18,21 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-youtube',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 2. Singles posts naar Facebook - 3x per dag (10:30, 14:30, 18:30 UTC)
SELECT cron.schedule(
  'post-singles-facebook',
  '30 10,14,18 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-singles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{"cron": true}'::jsonb
  ) as request_id;
  $$
);

-- 3. Albums posts naar Facebook - 3x per dag (11u, 15u, 19u UTC)
SELECT cron.schedule(
  'post-albums-facebook',
  '0 11,15,19 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-albums',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 4. Music History posts naar Facebook - 4x per dag (8u, 13u, 17u, 20u UTC)
SELECT cron.schedule(
  'post-music-history-facebook',
  '0 8,13,17,20 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-music-history',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 5. Schedule music history posts - 1x per dag om 6u UTC
SELECT cron.schedule(
  'schedule-music-history',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-music-history-posts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 6. Schedule YouTube posts - 1x per dag om 6:10 UTC
SELECT cron.schedule(
  'schedule-youtube',
  '10 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-youtube-posts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 7. Recycle Facebook queue (vult singles/albums queues) - 1x per dag om 7u UTC
SELECT cron.schedule(
  'recycle-fb-queue',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/recycle-facebook-queue',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);