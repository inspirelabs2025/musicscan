-- De prijscron schaalt mee met het aantal waardepagina's.
--
-- Met drie albums per dag duurde een ronde bij achttien pagina's zes dagen.
-- Dat werkte, maar bij een paar honderd pagina's wordt het een jaar, en dan
-- staat er onder elke kop "bijgewerkt op" een datum van maanden terug.
--
-- Elk uur twee albums is 48 per dag: bij 23 pagina's een ronde van een halve
-- dag, bij 250 pagina's een ronde van vijf dagen. De functie pakt altijd de
-- oudste priced_at eerst, dus een te snelle cadans verspilt hooguit
-- Discogs-verzoeken en levert nooit verkeerde data.
select cron.unschedule('refresh-value-prices-daily');

select cron.schedule(
  'refresh-value-prices-hourly',
  '25 * * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/refresh-value-prices?limit=2',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon key>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
