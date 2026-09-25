import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SITEMAP_PATHS } from '../_shared/indexable.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://musicscans.com';
const SITEMAP_BASE_URL = `${BASE_URL}/sm`;

// SEO focus = scan + value. Only the allowlist is indexable, so the sitemap
// contains nothing else. All content/image sitemaps are intentionally gone.
function generateStaticSitemapXml(): string {
  const urls = SITEMAP_PATHS.map((path) => {
    const loc = path === '/' ? `${BASE_URL}/` : `${BASE_URL}${path}`;
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Waardepagina's. Twee filters, allebei bewust:
 * alleen rijen met een prijsvork (zonder vork zet de pagina zichzelf op
 * noindex, en een noindex-URL hoort niet in een sitemap), en alleen de
 * Nederlandse variant zolang dat de enige geïndexeerde taal is.
 */
function generateValueSitemapXml(
  rows: Array<{ artist_slug: string; album_slug: string; priced_at: string | null }>,
): string {
  const urls = rows
    .map(({ artist_slug, album_slug, priced_at }) => {
      const loc = `${BASE_URL}/waarde/${artist_slug}/${album_slug}`;
      const lastmod = priced_at ? `\n    <lastmod>${priced_at.slice(0, 10)}</lastmod>` : '';
      return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateSitemapIndex(names: string[]): string {
  const now = new Date().toISOString();
  const sitemaps = names
    .map(
      (name) => `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/${name}</loc>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Waardepagina's met een vork ophalen; zonder vork staan ze op noindex.
    const { data: valueRows, error: valueError } = await supabase
      .from('value_pages')
      .select('artist_slug, album_slug, priced_at')
      .not('price_range_min', 'is', null)
      .not('price_range_max', 'is', null)
      .order('artist_slug');

    if (valueError) {
      console.error('value_pages ophalen mislukt:', valueError.message);
    }
    const rows = valueRows ?? [];
    console.log(`Waardepagina's in de sitemap: ${rows.length}`);

    const names = ['sitemap-static.xml'];
    if (rows.length) names.push('sitemap-waarde.xml');

    const keep = new Set(['sitemap-static.xml', 'sitemap-waarde.xml', 'sitemap-index.xml']);

    const uploads = [
      { name: 'sitemap-static.xml', data: generateStaticSitemapXml() },
      ...(rows.length
        ? [{ name: 'sitemap-waarde.xml', data: generateValueSitemapXml(rows) }]
        : []),
      { name: 'sitemap-index.xml', data: generateSitemapIndex(names) },
    ];

    for (const upload of uploads) {
      const result = await supabase.storage
        .from('sitemaps')
        .upload(upload.name, new Blob([upload.data], { type: 'application/xml' }), {
          contentType: 'application/xml; charset=utf-8',
          cacheControl: '0',
          upsert: true,
        });

      if (result.error) {
        throw new Error(`Failed to upload ${upload.name}: ${result.error.message}`);
      }
      console.log(`✅ Uploaded ${upload.name}`);
    }

    // Remove every legacy content/image sitemap so Search Console stops
    // discovering the archive URLs.
    const removed: string[] = [];
    try {
      const { data: existingFiles } = await supabase.storage.from('sitemaps').list();
      const stale = (existingFiles || [])
        .map((f) => f.name)
        .filter((name) => name.endsWith('.xml') && !keep.has(name));

      if (stale.length > 0) {
        const { error } = await supabase.storage.from('sitemaps').remove(stale);
        if (error) {
          console.error('Cleanup error (non-fatal):', error);
        } else {
          removed.push(...stale);
          console.log(`🧹 Removed ${stale.length} legacy sitemaps`);
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error (non-fatal):', cleanupError);
    }

    // Health check
    const healthChecks: Record<string, number | string> = {};
    for (const name of uploads.map((u) => u.name)) {
      const checkUrl =
        name === 'sitemap-index.xml' ? `${BASE_URL}/sitemap.xml` : `${SITEMAP_BASE_URL}/${name}`;
      try {
        const resp = await fetch(checkUrl, { method: 'HEAD' });
        healthChecks[name] = resp.status;
      } catch (e) {
        healthChecks[name] = `error: ${(e as Error).message}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sitemaps_updated: uploads.map((u) => u.name),
        legacy_sitemaps_removed: removed,
        urls: SITEMAP_PATHS,
        health_checks: healthChecks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('generate-static-sitemaps error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
