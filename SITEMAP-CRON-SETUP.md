# Sitemap Cron Job Setup

## Automatische Dagelijkse Sitemap Generatie

### Vereisten
De volgende PostgreSQL extensies moeten geactiveerd zijn in je Supabase project:
- `pg_cron` - voor scheduled jobs
- `pg_net` - voor HTTP requests vanuit de database

### Extensies Activeren
Voer de volgende SQL uit in de Supabase SQL Editor:

```sql
-- Activeer vereiste extensies
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Cron Job Aanmaken
Voer de volgende SQL uit om een dagelijkse cron job te maken die elke nacht om 2:00 uur de sitemaps genereert:

```sql
-- Maak dagelijkse sitemap generatie job
SELECT cron.schedule(
  'generate-sitemaps-daily',
  '0 2 * * *', -- Elke dag om 2:00 uur 's nachts
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-static-sitemaps',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**BELANGRIJK**: Vervang `YOUR_SERVICE_ROLE_KEY_HERE` met je Supabase Service Role Key (niet de Anon key!).

### Service Role Key Vinden
1. Ga naar je Supabase Dashboard: https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/settings/api
2. Kopieer de "service_role" key (niet de "anon" key!)
3. Plak deze in de SQL query hierboven

### Verificatie
Na het aanmaken van de cron job, kun je de status controleren met:

```sql
-- Bekijk alle actieve cron jobs
SELECT * FROM cron.job;

-- Bekijk uitvoeringsgeschiedenis
SELECT * FROM cron.job_run_details 
WHERE jobname = 'generate-sitemaps-daily'
ORDER BY start_time DESC 
LIMIT 10;
```

### Handmatige Trigger
Je kunt de sitemap generatie ook handmatig triggeren via:
- Admin UI: `/admin/sitemap-management` (klik op "Genereer Alle Sitemaps")
- Direct functie aanroep: `supabase.functions.invoke('generate-static-sitemaps')`

### Cron Job Verwijderen (indien nodig)
```sql
-- Verwijder de cron job
SELECT cron.unschedule('generate-sitemaps-daily');
```

### Output Locaties
Na succesvolle generatie zijn de sitemaps beschikbaar op:
- Blog: `https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml`
- Music Stories: `https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-music-stories.xml`
- Producten (Metaalprints): `https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml`

### Troubleshooting
Als de cron job niet werkt:
1. Controleer of de extensies actief zijn: `SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');`
2. Controleer de Service Role Key (moet beginnen met `eyJ...`)
3. Bekijk de Edge Function logs: https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/functions/generate-static-sitemaps/logs
4. Controleer de cron job uitvoering: `SELECT * FROM cron.job_run_details WHERE jobname = 'generate-sitemaps-daily' ORDER BY start_time DESC LIMIT 5;`
