-- Activeer vereiste extensies voor cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Maak dagelijkse sitemap generatie job
-- Let op: De service_role_key moet nog handmatig worden toegevoegd via Supabase dashboard
SELECT cron.schedule(
  'generate-sitemaps-daily',
  '0 2 * * *', -- Elke dag om 2:00 uur 's nachts
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-static-sitemaps',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);