-- Tijdelijke opbouw van de ~300 nieuwe waardepagina's uit value_seeds.
--
-- Discogs geeft 60 verzoeken per minuut en beide functies houden 1,1 s
-- tussen verzoeken aan, dus ze mogen niet tegelijk draaien. Verrijken loopt
-- op :00, :10, ... en is binnen twee minuten klaar; prijzen draait op :03 en
-- :06 van elk tiental. Het uurlijkse prijsjob staat zolang uit, anders
-- botst het op :25.
--
-- Als alle seeds verwerkt zijn: value-backfill-enrich en
-- value-backfill-prices uitzetten en refresh-value-prices-hourly terugzetten
-- (zie onderaan, uitgecommentarieerd).

select cron.unschedule('refresh-value-prices-hourly');

select cron.schedule(
  'value-backfill-enrich',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/enrich-value-pages?source=seeds&limit=5',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 115000
  );
  $$
);

select cron.schedule(
  'value-backfill-prices',
  '3,6,13,16,23,26,33,36,43,46,53,56 * * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/refresh-value-prices?limit=3',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 115000
  );
  $$
);

-- Na de opbouw:
-- select cron.unschedule('value-backfill-enrich');
-- select cron.unschedule('value-backfill-prices');
-- select cron.schedule('refresh-value-prices-hourly', '25 * * * *', $$ ...limit=2... $$);
