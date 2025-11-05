# Auto IndexNow Blog Submission - Cron Job Setup

## Overzicht
Dit document beschrijft hoe je de automatische blog submission naar IndexNow instelt via een dagelijkse cron job.

## Wat doet het?
- **Draait**: Dagelijks om 3:00 AM (Nederlandse tijd)
- **Selecteert**: 
  - Alle blogs die in de afgelopen 7 dagen zijn bijgewerkt
  - Top 20 meest bekeken blogs
- **Submits**: URLs naar IndexNow voor snelle indexering bij Bing + Google

## Edge Function Details
- **Naam**: `auto-submit-blogs-indexnow`
- **Locatie**: `supabase/functions/auto-submit-blogs-indexnow/index.ts`
- **Trigger**: Automatisch via cron job + handmatig via admin dashboard

## Cron Job Installatie

### Stap 1: Ga naar Supabase SQL Editor
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/sql/new)
2. Plak onderstaande SQL code
3. Klik op "Run"

### Stap 2: SQL Code voor Cron Job

```sql
-- Activeer benodigde extensies (indien nog niet actief)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Maak de cron job aan
SELECT cron.schedule(
  'auto-submit-blogs-indexnow-daily',
  '0 3 * * *',  -- Dagelijks om 3:00 AM UTC (4:00 AM Nederlandse zomertijd)
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/auto-submit-blogs-indexnow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Stap 3: Verifieer de Cron Job

```sql
-- Check of de cron job is aangemaakt
SELECT 
  jobid,
  jobname, 
  schedule, 
  active,
  database
FROM cron.job 
WHERE jobname = 'auto-submit-blogs-indexnow-daily';
```

**Verwacht resultaat**: 1 rij met:
- `jobname`: `auto-submit-blogs-indexnow-daily`
- `schedule`: `0 3 * * *`
- `active`: `true`

### Stap 4: Check Uitvoering Historie

```sql
-- Bekijk recente uitvoeringen
SELECT 
  runid,
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'auto-submit-blogs-indexnow-daily'
)
ORDER BY start_time DESC 
LIMIT 10;
```

## Handmatige Uitvoering via Admin Dashboard

Je kunt de functie ook handmatig triggeren:

1. Ga naar `/admin/seo-monitoring`
2. Klik op de **IndexNow** tab
3. Klik op de **Submit Nu** knop in de "Auto IndexNow Submitter" widget

## Monitoring

### Check IndexNow Queue Status
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE processed = false) as pending,
  COUNT(*) FILTER (WHERE processed = true) as completed
FROM indexnow_queue
WHERE source = 'auto-blog-submit'
AND created_at > NOW() - INTERVAL '7 days';
```

### Check Submission Success Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM indexnow_submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

## Troubleshooting

### Cron Job draait niet
```sql
-- Check of cron job actief is
SELECT * FROM cron.job WHERE jobname = 'auto-submit-blogs-indexnow-daily';

-- Activeer de job indien inactief
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto-submit-blogs-indexnow-daily'),
  is_active := true
);
```

### Verwijder oude/verkeerde cron job
```sql
SELECT cron.unschedule('auto-submit-blogs-indexnow-daily');
```

### Test de Edge Function handmatig
```bash
curl -X POST https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/auto-submit-blogs-indexnow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4" \
  -d '{}'
```

**Verwachte response**:
```json
{
  "success": true,
  "blogsFound": 35,
  "urlsQueued": 35,
  "processorTriggered": true,
  "message": "Successfully queued 35 blog URLs for IndexNow submission"
}
```

## Verwachte Resultaten

### Week 1
- ✅ Cron job draait dagelijks
- ✅ 30-50 URLs toegevoegd aan queue
- ✅ IndexNow processor verwerkt submissions
- ✅ Bing indexeert binnen 2-8 uur

### Week 2-4
- ✅ Google begint passief mee te luisteren
- ✅ Impressies stijgen in Google Search Console
- ✅ Top blogs verschijnen in Google search results

### Maand 1+
- ✅ 80%+ van blog posts geïndexeerd
- ✅ Rich results actief voor article schema
- ✅ Organic traffic groei zichtbaar

## Tips voor Optimale Indexering

1. **Content Kwaliteit**: Unieke, waardevolle content rankt beter
2. **Internal Linking**: Link tussen blog posts voor betere crawlbaarheid
3. **Update Frequency**: Regelmatig updaten signaleert frisheid
4. **Social Signals**: Share nieuwe posts op social media
5. **Sitemap Priority**: Hoogwaardige content krijgt hogere priority in sitemap

## Support Links

- [IndexNow Documentation](https://www.indexnow.org/)
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
