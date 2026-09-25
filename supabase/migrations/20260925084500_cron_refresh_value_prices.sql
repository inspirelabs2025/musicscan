-- Prijsvorken van de waardepagina's vers houden. Elk uur op minuut 25 (de
-- andere jobs zitten op 0, 15 en 30), drie albums per keer, oudste priced_at
-- eerst. Met het bestaande DISCOGS_TOKEN duurt een album ongeveer 25 seconden,
-- dus dit blijft ruim binnen de runtimegrens van de edge function.
--
-- Let op bij opschalen: drie albums per uur is 72 per dag. Vanaf een paar
-- honderd albums moet dit mee omhoog, of via een tweede job op een ander uur.
select cron.unschedule('refresh-value-prices-hourly')
where exists (select 1 from cron.job where jobname = 'refresh-value-prices-hourly');

select cron.schedule(
  'refresh-value-prices-hourly',
  '25 * * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/refresh-value-prices?limit=3',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
