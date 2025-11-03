# IndexNow Real-Time Indexing Setup

## Wat is IndexNow?

IndexNow is een protocol dat real-time URL indexing mogelijk maakt bij zoekmachines zoals:
- ✅ Microsoft Bing
- ✅ Yandex
- ✅ Seznam.cz
- ✅ Naver
- 🟡 Google (luistert passief mee via cross-submission)

## Hoe werkt het?

1. **Automatische Triggers**: Bij het publiceren van nieuwe content (blog posts, music stories, products) wordt automatisch een database trigger geactiveerd
2. **Queue System**: URLs worden toegevoegd aan een wachtrij (`indexnow_queue`)
3. **Batch Processing**: URLs worden elke 5 minuten in batches gesubmit naar IndexNow API
4. **Logging**: Alle submissions worden gelogd in `indexnow_submissions` tabel

## Implementatie Details

### Database Structuur

**indexnow_queue**
- Wachtrij voor URLs die gesubmit moeten worden
- Automatisch gevuld via triggers op `blog_posts`, `music_stories`, `platform_products`

**indexnow_submissions**
- Log van alle IndexNow API calls
- Bevat status codes en response bodies

### Edge Function

**Function**: `indexnow-submit`
**URL**: `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/indexnow-submit`

**Request Body**:
```json
{
  "urls": ["/plaat-verhaal/slug1", "/product/slug2"],
  "contentType": "blog_post"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully submitted 2 URLs to IndexNow",
  "urls": ["https://www.musicscan.app/plaat-verhaal/slug1", ...]
}
```

### IndexNow API Key

**Location**: `public/indexnow-key.txt`
**Key**: `8f9a2b7e4c1d6e3a5f0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7`

⚠️ Deze key moet ook geregistreerd worden in Bing Webmaster Tools

## Handmatige Submission

### Via Admin Dashboard
1. Ga naar Super Admin Dashboard
2. Navigeer naar "IndexNow Monitor" sectie
3. Klik op "Submit Nu" knop om wachtrij handmatig te verwerken

### Via Database
```sql
-- Submit specifieke URL
SELECT public.submit_to_indexnow('/plaat-verhaal/new-album', 'blog_post');

-- Process hele wachtrij
SELECT * FROM public.process_indexnow_queue();
```

## Automated Processing (Optioneel)

Om de wachtrij automatisch te verwerken, stel een pg_cron job in:

```sql
-- Voer elke 5 minuten uit
SELECT cron.schedule(
  'process-indexnow-queue',
  '*/5 * * * *',
  $$
  SELECT * FROM public.process_indexnow_queue();
  $$
);
```

## Monitoring

### Statistieken bekijken
```sql
-- Pending submissions
SELECT COUNT(*) FROM indexnow_queue WHERE processed = FALSE;

-- Successvolle submissions (laatste 24 uur)
SELECT COUNT(*) FROM indexnow_submissions 
WHERE status_code IN (200, 202) 
  AND submitted_at > now() - interval '24 hours';

-- Mislukte submissions
SELECT * FROM indexnow_submissions 
WHERE status_code NOT IN (200, 202)
ORDER BY submitted_at DESC;
```

### Logs bekijken
```sql
-- Recente submissions met details
SELECT 
  submitted_at,
  content_type,
  status_code,
  array_length(urls, 1) as url_count,
  response_body
FROM indexnow_submissions
ORDER BY submitted_at DESC
LIMIT 10;
```

## Status Codes

- **200 OK**: URL successfully submitted
- **202 Accepted**: URL accepted for processing
- **400 Bad Request**: Invalid request format
- **403 Forbidden**: Invalid API key
- **422 Unprocessable**: Invalid URL format
- **429 Too Many Requests**: Rate limit exceeded (max 200/day per host)

## Rate Limits

- **Max URLs per request**: 10.000
- **Max submissions per day**: 200 per host
- **Batch size**: 100 URLs (geïmplementeerd in `process_indexnow_queue`)

## Troubleshooting

### URLs worden niet gesubmit
1. Check of triggers actief zijn: `SELECT * FROM pg_trigger WHERE tgname LIKE '%indexnow%';`
2. Check wachtrij: `SELECT * FROM indexnow_queue WHERE processed = FALSE;`
3. Test Edge Function handmatig via admin dashboard

### Rate Limit Errors (429)
- Wacht tot volgende dag
- Verminder batch size in `process_indexnow_queue`
- Prioriteer belangrijke content

### API Key Errors (403)
- Verifieer dat `public/indexnow-key.txt` toegankelijk is
- Check of key geregistreerd is in Bing Webmaster Tools

## Best Practices

1. ✅ Submit alleen gepubliceerde content
2. ✅ Gebruik batch processing (niet per URL individueel)
3. ✅ Monitor rate limits dagelijks
4. ✅ Prioriteer nieuwe/gewijzigde content
5. ❌ Vermijd duplicate submissions binnen 24 uur
6. ❌ Submit geen niet-indexeerbare URLs (admin pages, etc.)

## Verwachte Resultaten

- **Blog posts**: Geïndexeerd binnen 2-8 uur (was: 2-7 dagen)
- **Music stories**: Geïndexeerd binnen 4-12 uur
- **Products**: Geïndexeerd binnen 6-24 uur
- **Totale verbetering**: 80-95% snellere indexing

## Links

- [IndexNow Protocol](https://www.indexnow.org/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Admin Dashboard](https://www.musicscan.app/admin/super)
