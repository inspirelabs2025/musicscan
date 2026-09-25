/**
 * refresh-value-prices — houdt de prijsvorken van de waardepagina's vers.
 *
 * Per aanroep worden de albums met de oudste `priced_at` opnieuw geprijsd.
 * De vork is p20 tot p80 over de vraagprijzen van alle persingen die echt te
 * koop staan, afgerond in stappen die meegroeien met het bedrag. Daardoor
 * verschuift hij niet bij elke kleine marktbeweging, wat het hele punt is:
 * de pagina toont een vork, geen dagkoers.
 *
 * Discogs staat onauthenticated op 25 verzoeken per minuut. Met een token in
 * DISCOGS_TOKEN mag het er 60 en gaat dit ruim twee keer zo snel.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN') ?? '';

const UA = 'MusicScan/1.0 +https://musicscans.com (waardepaginas)';
const SPACING_MS = DISCOGS_TOKEN ? 1100 : 2600;
/** Ruim onder de limiet van de runtime blijven; liever een album minder. */
const DEADLINE_MS = 110_000;
/** Onder dit aantal waarnemingen is het geen vork maar een anekdote. */
const MIN_OBSERVATIONS = 5;
/** Meer persingen dan dit per album levert nauwelijks een andere vork op. */
const MAX_PRESSINGS = 25;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const rest = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : await res.json();
};

const discogs = async (id: number): Promise<{ lowest_price: number | null; num_for_sale: number | null } | null> => {
  const url = `https://api.discogs.com/releases/${id}${DISCOGS_TOKEN ? `?token=${DISCOGS_TOKEN}` : ''}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(20_000); continue; }
      if (!res.ok) return null;
      const d = await res.json();
      return { lowest_price: d.lowest_price ?? null, num_for_sale: d.num_for_sale ?? null };
    } catch {
      await sleep(2000);
    }
  }
  return null;
};

const percentile = (xs: number[], p: number): number => {
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const k = (s.length - 1) * p;
  const lo = Math.floor(k);
  const hi = Math.min(lo + 1, s.length - 1);
  return s[lo] + (s[hi] - s[lo]) * (k - lo);
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Grovere stappen naarmate het bedrag hoger wordt; zo staat de vork stil. */
const step = (v: number): number => (v < 10 ? 1 : v < 25 ? 5 : v < 100 ? 10 : v < 250 ? 25 : 50);
const floorTo = (v: number) => Math.max(1, Math.floor(v / step(v)) * step(v));
const ceilTo = (v: number) => Math.ceil(v / step(v)) * step(v);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '1', 10) || 1, 1), 10);

  const done: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

  try {
    // Oudste prijs eerst; rijen zonder prijs hebben voorrang.
    const albums = await rest(
      `value_pages?select=group_slug,artist_slug,album_slug,priced_at,price_range_min,price_range_max` +
        `&order=priced_at.asc.nullsfirst&limit=${limit}`,
    );

    for (const album of albums as Array<{
      group_slug: string;
      priced_at: string | null;
      price_range_min: number | string | null;
      price_range_max: number | string | null;
    }>) {
      if (Date.now() - started > DEADLINE_MS) {
        skipped.push({ group_slug: album.group_slug, reason: 'deadline' });
        continue;
      }

      const releases = await rest(
        `releases?select=discogs_id&group_slug=eq.${encodeURIComponent(album.group_slug)}` +
          `&enriched_at=not.is.null&discogs_id=not.is.null&limit=${MAX_PRESSINGS}`,
      ) as Array<{ discogs_id: number }>;

      const prices: number[] = [];
      for (const r of releases) {
        if (Date.now() - started > DEADLINE_MS) break;
        const d = await discogs(r.discogs_id);
        if (d?.lowest_price && (d.num_for_sale ?? 0) > 0) prices.push(Number(d.lowest_price));
        await sleep(SPACING_MS);
      }

      if (prices.length < MIN_OBSERVATIONS) {
        skipped.push({ group_slug: album.group_slug, reason: 'te weinig waarnemingen', n: prices.length });
        continue;
      }

      const p20 = percentile(prices, 0.2);
      const p80 = percentile(prices, 0.8);
      const med = median(prices);
      let low = floorTo(p20);
      let high = ceilTo(p80);
      if (high <= low) high = low + step(low);
      // De mediaan moet binnen de vork vallen, anders spreekt de pagina zichzelf tegen.
      if (med < low) low = floorTo(med);
      if (med > high) high = ceilTo(med);

      const at = new Date().toISOString();
      const sources = [{
        source: 'discogs_api',
        low, high,
        median: Math.round(med * 100) / 100,
        p20: Math.round(p20 * 100) / 100,
        p80: Math.round(p80 * 100) / 100,
        min: Math.round(Math.min(...prices) * 100) / 100,
        max: Math.round(Math.max(...prices) * 100) / 100,
        n: prices.length,
        at,
      }];

      // priced_at schuift elke run op, price_changed_at alleen als de vork
      // echt beweegt. Een lastmod die opschuift zonder inhoudelijke wijziging
      // leert Google die lastmod te negeren.
      const prevLow = Number(album.price_range_min);
      const prevHigh = Number(album.price_range_max);
      const changed = prevLow !== low || prevHigh !== high;

      await rest(
        `releases?group_slug=eq.${encodeURIComponent(album.group_slug)}&enriched_at=not.is.null`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            price_range_min: low,
            price_range_max: high,
            price_sources: sources,
            priced_at: at,
            status: 'priced',
            ...(changed ? { price_changed_at: at } : {}),
          }),
        },
      );

      done.push({ group_slug: album.group_slug, low, high, median: sources[0].median, n: prices.length, changed });
      console.log(`${album.group_slug}: EUR ${low}-${high}, mediaan ${sources[0].median}, n=${prices.length}${changed ? ' (vork gewijzigd)' : ''}`);
    }

    return new Response(
      JSON.stringify({ ok: true, refreshed: done, skipped, ms: Date.now() - started }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('refresh-value-prices:', error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error), refreshed: done, skipped }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
