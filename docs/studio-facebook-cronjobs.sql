-- =====================================================
-- CRONJOB SETUP VOOR STUDIO FACEBOOK AUTO-POSTING
-- =====================================================
-- Deze SQL moet handmatig worden uitgevoerd in de Supabase SQL Editor
-- omdat cron.schedule INSERT operaties nodig heeft.
-- 
-- Ga naar: https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/sql
-- =====================================================

-- Cronjob 1: Schedule studio post elke dag om 08:00 UTC
-- Dit selecteert de volgende studio in de rotatie en plant deze in
SELECT cron.schedule(
  'schedule-studio-posts-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-studio-posts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Cronjob 2: Post scheduled studio elke dag om 12:00 UTC
-- Dit pakt de ingeplande post en post deze naar Facebook
SELECT cron.schedule(
  'post-scheduled-studios-daily',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/post-scheduled-studios',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- =====================================================
-- VERIFICATIE COMMANDS
-- =====================================================

-- Check of de cronjobs zijn aangemaakt:
-- SELECT * FROM cron.job WHERE jobname LIKE '%studio%';

-- Bekijk recente uitvoeringen:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Handmatig testen (scheduling):
-- SELECT net.http_post(
--   url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-studio-posts',
--   headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
--   body:='{}'::jsonb
-- );

-- =====================================================
-- ROTATIE LOGICA
-- =====================================================
-- - 39 gepubliceerde studios
-- - 1 studio per dag gepost
-- - Elke studio wordt ~1x per 39 dagen gepost
-- - Studios met laagste facebook_posted_count worden eerst gekozen
-- - Nieuwe studios krijgen automatisch prioriteit (posted_count = 0)
