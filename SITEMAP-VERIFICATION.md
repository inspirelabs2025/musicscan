# Sitemap Verification Test Suite

## Database Counts (Expected)
- **Blog posts**: 1949
- **Music stories**: 17
- **Platform products**: 740
- **Static routes**: ~15-20

## A) Compare Public vs Storage (Byte-Identical)

### Blog Sitemap
```bash
# Public via Vercel
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | md5sum

# Direct from Storage
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml' | md5sum
```
✅ **Expected**: Identical hashes

### Products Sitemap
```bash
# Public via Vercel
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | md5sum

# Direct from Storage
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml' | md5sum
```
✅ **Expected**: Identical hashes

### Music Stories Sitemap
```bash
# Public via Vercel
curl -s 'https://musicscan.app/sitemaps/sitemap-music-stories.xml?t='$(date +%s) | md5sum

# Direct from Storage
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-music-stories.xml' | md5sum
```
✅ **Expected**: Identical hashes

### Static Sitemap
```bash
# Public via Vercel
curl -s 'https://musicscan.app/sitemaps/sitemap-static.xml?t='$(date +%s) | md5sum

# Direct from Storage
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-static.xml' | md5sum
```
✅ **Expected**: Identical hashes

## B) Force No-Cache + Show HTTP Status

```bash
# Sitemap Index
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemap.xml

# Blog Sitemap
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-blog.xml

# Products Sitemap
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-products.xml

# Music Stories Sitemap
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-music-stories.xml

# Static Sitemap
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-static.xml
```
✅ **Expected**: `200 application/xml; charset=utf-8` for all

## C) Spot-Check First/Last URLs (Real Content)

### Blog Sitemap - First 40 Lines
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | sed -n '1,120p' | head -n 40
```

### Blog Sitemap - Last 40 Lines
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | tail -n 40
```

### Products Sitemap - First 40 Lines
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | sed -n '1,120p' | head -n 40
```

### Products Sitemap - Last 40 Lines
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | tail -n 40
```

✅ **Expected**: Many `<url>` blocks with real slugs (not placeholder text)

## D) Validate ISO-8601 Timestamps

### Blog Sitemap
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | grep -Eo '<lastmod>[^<]+' | head
```

### Products Sitemap
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | grep -Eo '<lastmod>[^<]+' | head
```

### Music Stories Sitemap
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-music-stories.xml?t='$(date +%s) | grep -Eo '<lastmod>[^<]+' | head
```

✅ **Expected**: Full ISO-8601 timestamps (e.g., `<lastmod>2025-11-06T15:42:00Z`)

## E) Robots.txt Verification

```bash
curl -s https://musicscan.app/robots.txt | grep -i '^Sitemap:'
```

✅ **Expected**: `Sitemap: https://musicscan.app/sitemap.xml`

## F) URL Count Verification

### Sitemap Index (Child Sitemaps)
```bash
curl -s 'https://musicscan.app/sitemap.xml?t='$(date +%s) | grep -c "<sitemap>"
```
✅ **Expected**: `7`

### Blog Sitemap (URL Count)
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | grep -c "<url>"
```
✅ **Expected**: `~1949` (≥ 1852, which is 95% of 1949)

### Music Stories Sitemap (URL Count)
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-music-stories.xml?t='$(date +%s) | grep -c "<url>"
```
✅ **Expected**: `17`

### Products Sitemap (URL Count)
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | grep -c "<url>"
```
✅ **Expected**: `740`

### Static Sitemap (URL Count)
```bash
curl -s 'https://musicscan.app/sitemaps/sitemap-static.xml?t='$(date +%s) | grep -c "<url>"
```
✅ **Expected**: `15-20`

## Complete Quick Test Script

Run all checks at once:

```bash
#!/bin/bash

echo "=== SITEMAP VERIFICATION TEST SUITE ==="
echo ""

# URL Counts
echo "📊 URL COUNTS:"
echo "Sitemap Index (expect 7):"
curl -s 'https://musicscan.app/sitemap.xml?t='$(date +%s) | grep -c "<sitemap>"

echo "Blog (expect ~1949):"
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | grep -c "<url>"

echo "Music Stories (expect 17):"
curl -s 'https://musicscan.app/sitemaps/sitemap-music-stories.xml?t='$(date +%s) | grep -c "<url>"

echo "Products (expect 740):"
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | grep -c "<url>"

echo "Static (expect 15-20):"
curl -s 'https://musicscan.app/sitemaps/sitemap-static.xml?t='$(date +%s) | grep -c "<url>"

echo ""
echo "🔍 HTTP STATUS & CONTENT-TYPE:"
echo "Index:"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemap.xml

echo "Blog:"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-blog.xml

echo "Products:"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-products.xml

echo "Stories:"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Cache-Control: no-cache" https://musicscan.app/sitemaps/sitemap-music-stories.xml

echo ""
echo "🔐 MD5 HASH COMPARISON (Public vs Storage):"
echo "Blog:"
echo -n "  Public: "
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | md5sum
echo -n "  Storage: "
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml' | md5sum

echo "Products:"
echo -n "  Public: "
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | md5sum
echo -n "  Storage: "
curl -s 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml' | md5sum

echo ""
echo "📅 ISO-8601 TIMESTAMP CHECK (first 3):"
echo "Blog:"
curl -s 'https://musicscan.app/sitemaps/sitemap-blog.xml?t='$(date +%s) | grep -Eo '<lastmod>[^<]+' | head -n 3

echo "Products:"
curl -s 'https://musicscan.app/sitemaps/sitemap-products.xml?t='$(date +%s) | grep -Eo '<lastmod>[^<]+' | head -n 3

echo ""
echo "🤖 ROBOTS.TXT CHECK:"
curl -s https://musicscan.app/robots.txt | grep -i '^Sitemap:'

echo ""
echo "✅ TEST COMPLETE"
```

## Troubleshooting

### If Counts Are Low:
1. Check Vercel deployment Routes tab - XML rewrites must be BEFORE SPA fallback
2. Purge Vercel cache: Project → Settings → Cache → Purge Everything
3. Ensure no `public/sitemaps/*.xml` files exist in repo

### If Content-Type Wrong or 404:
1. Verify rewrite order in `vercel.json` - XML routes before `/(.*)`
2. Check for conflicting middleware or route handlers
3. Verify deployment is live (not preview)

### If Hash Mismatch:
1. Edge cache issue - retry with `?t=$(date +%s)` timestamp
2. Purge Vercel cache completely
3. Wait 60 seconds for cache to clear, then re-test

### If No URLs Found:
1. Check Supabase Storage bucket `sitemaps` exists and is public
2. Verify edge function `generate-static-sitemaps` ran successfully
3. Check function logs for errors
