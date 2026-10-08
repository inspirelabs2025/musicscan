-- Opbouw uit value_seeds afgerond op 8 oktober 23:45: 660 albums in de view,
-- 658 met een prijsvork. De backfill-jobs staan uit (niet verwijderd, zodat
-- een volgende ronde seeds ze met cron.alter_job weer aan kan zetten).
--
-- De vaste verversing loopt nu elk half uur met 3 albums: 144 per dag, dus
-- elk album krijgt ongeveer elke 4,5 dag een nieuwe prijs. De naam blijft
-- refresh-value-prices-hourly zodat bestaande verwijzingen kloppen.

select cron.alter_job(jobid, active := false) from cron.job
 where jobname in ('value-backfill-enrich', 'value-backfill-prices');

select cron.schedule(
  'refresh-value-prices-hourly',
  '25,55 * * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/refresh-value-prices?limit=3',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb, timeout_milliseconds := 115000);
  $$
);
