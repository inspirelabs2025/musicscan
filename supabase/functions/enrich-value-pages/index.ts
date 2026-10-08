/**
 * enrich-value-pages — maakt van een albumgroep een publiceerbare waardepagina.
 *
 * Een waardepagina leeft van de persingentabel: zonder persingen is het een
 * dunne pagina met een prijs erop. Deze functie haalt per albumgroep de
 * versies bij Discogs op, schrijft ze als rijen in `releases` en vult de
 * samenvattende velden waar de view public.value_pages op draait. Daarna zet
 * `enriched_at` de groep in de view; de prijsvork komt later van
 * refresh-value-prices.
 *
 * Twee bronnen. Standaard public.value_candidates: gescande groepen met de
 * meeste verschillende catalogusnummers en landen eerst. Met ?source=seeds
 * public.value_seeds: albums waar op gezocht wordt, ook als ze nooit gescand
 * zijn. Voor een seed zonder master_id zoekt de functie die eerst op bij
 * Discogs; artiest en titel komen daarna van de master zelf, zodat de slug
 * en de kop kloppen met wat Discogs en de bezoeker kennen.
 *
 * Discogs geeft met DISCOGS_TOKEN 60 verzoeken per minuut. Een album kost er
 * een tot drie (de versiepagina's), dus dit is veel goedkoper dan het prijzen.
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
const DEADLINE_MS = 110_000;
/** Zoveel versies halen we op; daarboven voegt een extra pagina niets toe. */
const MAX_VERSIONS = 300;
/** Zoveel persingen bewaren we als rij — genoeg voor de tabel en het prijzen. */
const MAX_ROWS = 25;

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
  // Met Prefer: return=minimal antwoordt PostgREST met 201 en een lege body.
  // res.json() struikelt daarover, dus eerst als tekst lezen.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

interface Version {
  id: number;
  label?: string;
  country?: string;
  title?: string;
  major_formats?: string[];
  format?: string;
  catno?: string;
  released?: string;
  thumb?: string;
  stats?: { community?: { in_collection?: number; in_wantlist?: number } };
}

const discogsJson = async (url: string): Promise<any | null> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(20_000); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(2000);
    }
  }
  return null;
};

/**
 * Discogs zet in `released` van alles: "1983", "1983-05-01", "Jun 1983" en
 * soms niets. Alleen een viercijferig jaar na 1900 is bruikbaar — zonder deze
 * filter belandt er een "22" in reissue_years, zoals nu bij ZZ Top.
 */
const yearOf = (v: Version): number | null => {
  const m = String(v.released ?? '').match(/\b(19|20)\d{2}\b/);
  const y = m ? parseInt(m[0], 10) : NaN;
  return Number.isFinite(y) && y > 1900 ? y : null;
};

const owners = (v: Version) => v.stats?.community?.in_collection ?? 0;
const wanters = (v: Version) => v.stats?.community?.in_wantlist ?? 0;

const usableCatno = (c?: string) =>
  !!c && !['none', 'None', '-', ''].includes(c.trim());

/** Welke drager, in de termen die de pagina gebruikt. */
const mediaOf = (v: Version): string => {
  const f = (v.major_formats ?? []).join(' ');
  if (/CD/i.test(f)) return 'CD';
  if (/Vinyl|LP/i.test(f)) return 'Vinyl';
  if (/Cassette/i.test(f)) return 'Cassette';
  return (v.major_formats ?? [])[0] ?? 'Overig';
};

/** Het taalgebied waar een bezoeker zijn eigen persing in herkent. */
const LOCALE_COUNTRIES: Record<string, string[]> = {
  nl: ['Netherlands'],
  de: ['Germany', 'West Germany', 'Germany, Austria, & Switzerland'],
  fr: ['France'],
  en: ['UK', 'US', 'UK & Europe', 'Europe'],
};

const pressingOf = (v: Version) => ({
  year: yearOf(v) ? String(yearOf(v)) : undefined,
  country: v.country,
  label: v.label,
  catno: v.catno,
  have: owners(v),
  want: wanters(v),
});

/**
 * Een titel moet leesbaar zijn boven een Nederlandse pagina: Latijns schrift,
 * cijfers en leestekens. Getallen alleen ("1999", "21") mogen; Japans of
 * Cyrillisch niet.
 */
const LATIN_TITLE = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;

/**
 * Een titel die niemand hier kan lezen hoort niet boven een Nederlandse
 * pagina. Bij Japanse of Chinese uitgaven draagt de groep soms die titel;
 * dan pakken we de meest voorkomende titel met Latijnse letters.
 */
const readableTitle = (current: string, versions: Version[]): string => {
  // Een titel van alleen cijfers ("1999", "21") is leesbaar en blijft staan;
  // eerder koos deze functie dan "Nineteen Ninety Nine" of "21 + Instrumentals".
  if (LATIN_TITLE.test(current)) return current;
  const tally = new Map<string, number>();
  for (const v of versions) {
    const t = (v.title ?? '').trim();
    if (t && LATIN_TITLE.test(t)) tally.set(t, (tally.get(t) ?? 0) + 1);
  }
  let best = current;
  let bestN = 0;
  for (const [t, n] of tally) if (n > bestN) { best = t; bestN = n; }
  return best;
};


/** Zelfde slugregel als de bestaande groepen: accenten weg, alles behalve a-z0-9 wordt een streep. */
const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Discogs nummert naamgenoten: "Queen (2)". Dat hoort niet op de pagina. */
const cleanArtist = (s: string) => s.replace(/\s*\(\d+\)$/, '').replace(/\*$/, '').trim();

const normTitle = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

const tokenParam = DISCOGS_TOKEN ? `token=${DISCOGS_TOKEN}` : '';

interface Album {
  group_slug: string;
  artist_slug: string;
  artist: string;
  album_title: string;
  master_id: number;
}

/**
 * Een master zoeken bij Discogs. De zoekfunctie geeft "Artiest - Titel" terug;
 * we nemen het eerste resultaat waarvan de titel de gezochte titel bevat, met
 * de meeste verzamelaars bovenaan. Zonder token zoekt Discogs niet.
 */
const findMaster = async (artist: string, title: string): Promise<number | null> => {
  if (!DISCOGS_TOKEN) return null;
  const params = new URLSearchParams({ type: 'master', release_title: title.replace(/\(.*?\)/g, '').trim(), per_page: '10' });
  if (artist && artist.toLowerCase() !== 'various') params.set('artist', artist);
  const data = await discogsJson(`https://api.discogs.com/database/search?${params}&${tokenParam}`);
  await sleep(SPACING_MS);
  const want = normTitle(title);
  const various = !artist || artist.toLowerCase() === 'various';
  const wantArtist = normTitle(artist);
  const hits = (data?.results ?? []) as Array<{ id: number; title: string }>;
  // Discogs geeft "Artiest - Titel". De artiest moet kloppen (bij een
  // verzamelalbum: "Various"), anders wordt "Grease" een single van Frankie
  // Valli en "Saturday Night Fever" een album van The Devil Dogs.
  const parsed = hits.map((h) => {
    const [a, ...rest] = String(h.title).split(' - ');
    return { id: h.id, artist: normTitle(a.replace(/\s*\(\d+\)$/, '').replace(/\*$/, '')), title: normTitle(rest.join(' - ')) };
  }).filter((h) => (various ? h.artist === 'various' : h.artist === wantArtist || h.artist.startsWith(wantArtist)));
  // Exacte titel eerst, in de volgorde van Discogs. Een titel die met de
  // gezochte begint ("1989 (Taylor's Version)") alleen als er niets exacts is,
  // en nooit bij korte titels als "21" of "4".
  const exact = parsed.find((h) => h.title === want);
  if (exact) return exact.id;
  if (want.length < 5) return null;
  return parsed.find((h) => h.title.startsWith(want))?.id ?? null;
};

/** Van een master de nette artiestnaam en titel, zodat slug en kop kloppen. */
const masterInfo = async (id: number): Promise<{ artist: string; title: string } | null> => {
  const m = await discogsJson(`https://api.discogs.com/masters/${id}?${tokenParam}`);
  await sleep(SPACING_MS);
  if (!m?.title) return null;
  const names = (m.artists ?? []) as Array<{ name: string; join?: string }>;
  const artist = names.length
    ? names.map((a, i) => cleanArtist(a.name) + (i < names.length - 1 ? ` ${a.join || '&'} ` : '')).join('').replace(/\s+,/g, ',').trim()
    : 'Various';
  return { artist, title: String(m.title).trim() };
};

/**
 * Een albumgroep verrijken: versies ophalen, persingen wegschrijven, samenvatting
 * op de groep zetten. Geeft het resultaat terug of de reden waarom niet.
 */
const enrichAlbum = async (
  album: Album,
  opts: { started: number; dryRun: boolean; minUsable: number },
): Promise<{ ok: true; info: Record<string, unknown> } | { ok: false; reason: string; n?: number }> => {
  const versions: Version[] = [];
  let items = 0;
  for (let page = 1; page <= Math.ceil(MAX_VERSIONS / 100); page++) {
    if (Date.now() - opts.started > DEADLINE_MS) break;
    const q = `https://api.discogs.com/masters/${album.master_id}/versions?per_page=100&page=${page}` +
      (tokenParam ? `&${tokenParam}` : '');
    const data = await discogsJson(q);
    await sleep(SPACING_MS);
    if (!data?.versions?.length) break;
    items = data.pagination?.items ?? items;
    versions.push(...data.versions as Version[]);
    if (page >= (data.pagination?.pages ?? 1)) break;
  }

  if (versions.length === 0) return { ok: false, reason: 'geen versies' };

  const usable = versions.filter((v) => usableCatno(v.catno) && yearOf(v) !== null);
  if (usable.length < opts.minUsable) return { ok: false, reason: 'te weinig bruikbare persingen', n: usable.length };

  const byOwners = [...usable].sort((a, b) => owners(b) - owners(a));
  const years = [...new Set(usable.map(yearOf).filter((y): y is number => y !== null))].sort((a, b) => a - b);
  const earliest = years[0];

  // Niet per se de allereerste persing, wel de uitgave uit het jaar van
  // verschijnen die de meeste verzamelaars bezitten. De pagina zegt dat er
  // ook bij.
  const firstPressing = byOwners.find((v) => yearOf(v) === earliest) ?? byOwners[0];

  const countries = [...new Set(usable.map((v) => v.country).filter(Boolean))] as string[];

  const formatCounts: Record<string, number> = {};
  for (const v of usable) {
    const k = mediaOf(v);
    formatCounts[k] = (formatCounts[k] ?? 0) + 1;
  }

  const byCountry: Record<string, number> = {};
  for (const c of countries) byCountry[c] = usable.filter((v) => v.country === c).length;

  const exampleByLocale: Record<string, unknown> = {};
  for (const [loc, wanted] of Object.entries(LOCALE_COUNTRIES)) {
    const hit = byOwners.find((v) => v.country && wanted.includes(v.country));
    if (hit) exampleByLocale[loc] = { year: yearOf(hit) ? String(yearOf(hit)) : undefined, country: hit.country, catno: hit.catno };
  }
  if (!exampleByLocale.en && byOwners[0]) {
    const v = byOwners[0];
    exampleByLocale.en = { year: yearOf(v) ? String(yearOf(v)) : undefined, country: v.country, catno: v.catno };
  }

  const title = readableTitle(album.album_title, versions);
  const art = byOwners.find((v) => v.thumb)?.thumb ?? null;
  const now = new Date().toISOString();

  const aggregates = {
    version_count: items || usable.length,
    country_count: countries.length,
    first_pressing: pressingOf(firstPressing),
    example_pressing_by_locale: exampleByLocale,
    pressings_by_country: byCountry,
    format_prices: formatCounts,
    reissue_years: years,
    have_count: owners(byOwners[0]),
    want_count: wanters(byOwners[0]),
    album_title: title,
    ...(art ? { artwork_url: art } : {}),
    enriched_at: now,
    status: 'enriched',
  };

  const info = {
    group_slug: album.group_slug,
    titel: title,
    versies: items,
    landen: countries.length,
    persingen_bewaard: Math.min(usable.length, MAX_ROWS),
    jaren: `${years[0]}–${years[years.length - 1]}`,
  };
  if (opts.dryRun) return { ok: true, info: { ...info, dry_run: true } };

  // De persingen als rijen wegschrijven, meest verzamelde eerst; de view
  // bouwt de tabel hieruit op.
  const rows = byOwners.slice(0, MAX_ROWS).map((v) => ({
    discogs_id: v.id,
    artist: album.artist,
    title,
    album_title: title,
    slug: `${album.group_slug}-${v.id}`,
    artist_slug: album.artist_slug,
    group_slug: album.group_slug,
    master_id: album.master_id,
    label: v.label ?? null,
    catalog_number: v.catno ?? null,
    year: yearOf(v),
    format: mediaOf(v),
    country: v.country ?? null,
  }));

  await rest('releases?on_conflict=discogs_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });

  // Pas daarna de samenvatting op alle rijen van de groep zetten, zodat de
  // groep nooit half in de view verschijnt.
  await rest(`releases?group_slug=eq.${encodeURIComponent(album.group_slug)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(aggregates),
  });

  console.log(`${album.group_slug}: ${items} versies, ${countries.length} landen, ${rows.length} persingen bewaard`);
  return { ok: true, info };
};

/** Seeds hebben een hogere lat: een pagina met minder dan acht persingen is te dun. */
const SEED_MIN_USABLE = 8;

const setSeed = (id: number, fields: Record<string, unknown>) =>
  rest(`value_seeds?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ attempted_at: new Date().toISOString(), ...fields }),
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '3', 10) || 3, 1), 25);
  const dryRun = url.searchParams.get('dry_run') === '1';
  const source = url.searchParams.get('source') === 'seeds' ? 'seeds' : 'candidates';

  const done: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

  try {
    if (source === 'seeds') {
      const seeds = await rest(
        `value_seeds?select=id,artist,title,master_id&status=eq.pending&order=priority.desc,id.asc&limit=${limit}`,
      ) as Array<{ id: number; artist: string; title: string; master_id: number | null }>;

      for (const seed of seeds) {
        if (Date.now() - started > DEADLINE_MS) {
          skipped.push({ seed: seed.id, reason: 'deadline' });
          continue;
        }
        const masterId = seed.master_id ?? await findMaster(seed.artist, seed.title);
        if (!masterId) {
          if (!dryRun) await setSeed(seed.id, { status: 'skipped', note: 'geen master gevonden' });
          skipped.push({ seed: `${seed.artist} – ${seed.title}`, reason: 'geen master gevonden' });
          continue;
        }
        const m = await masterInfo(masterId);
        if (!m) {
          if (!dryRun) await setSeed(seed.id, { status: 'skipped', master_id: masterId, note: 'master niet leesbaar' });
          skipped.push({ seed: `${seed.artist} – ${seed.title}`, reason: 'master niet leesbaar' });
          continue;
        }
        const artistSlug = slugify(m.artist);
        const groupSlug = `${artistSlug}-${slugify(m.title)}`;
        if (!artistSlug || slugify(m.title).length < 1 || !LATIN_TITLE.test(m.title)) {
          if (!dryRun) await setSeed(seed.id, { status: 'skipped', master_id: masterId, note: 'geen bruikbare slug of titel' });
          skipped.push({ seed: `${seed.artist} – ${seed.title}`, reason: 'geen bruikbare slug of titel' });
          continue;
        }
        const existing = await rest(
          `releases?select=id&group_slug=eq.${encodeURIComponent(groupSlug)}&enriched_at=not.is.null&limit=1`,
        ) as unknown[];
        if (existing.length) {
          if (!dryRun) await setSeed(seed.id, { status: 'exists', master_id: masterId, group_slug: groupSlug });
          skipped.push({ seed: `${seed.artist} – ${seed.title}`, reason: 'bestaat al', group_slug: groupSlug });
          continue;
        }
        const res = await enrichAlbum(
          { group_slug: groupSlug, artist_slug: artistSlug, artist: m.artist, album_title: m.title, master_id: masterId },
          { started, dryRun, minUsable: SEED_MIN_USABLE },
        );
        if (res.ok) {
          if (!dryRun) await setSeed(seed.id, { status: 'enriched', master_id: masterId, group_slug: groupSlug });
          done.push({ seed: seed.id, artiest: m.artist, ...res.info });
        } else {
          if (!dryRun) await setSeed(seed.id, { status: 'skipped', master_id: masterId, group_slug: groupSlug, note: res.reason + (res.n !== undefined ? ` (${res.n})` : '') });
          skipped.push({ seed: `${seed.artist} – ${seed.title}`, reason: res.reason, n: res.n });
        }
      }
    } else {
      const candidates = await rest(
        `value_candidates?select=group_slug,artist_slug,album_slug,artist,album_title,master_id,catnos,landen,score` +
          `&master_id=not.is.null&order=score.desc&limit=${limit}`,
      ) as Array<Album>;

      for (const album of candidates) {
        if (Date.now() - started > DEADLINE_MS) {
          skipped.push({ group_slug: album.group_slug, reason: 'deadline' });
          continue;
        }
        const res = await enrichAlbum(album, { started, dryRun, minUsable: 3 });
        if (res.ok) done.push(res.info);
        else skipped.push({ group_slug: album.group_slug, reason: res.reason, n: res.n });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, source, enriched: done, skipped, ms: Date.now() - started }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('enrich-value-pages:', error);
    return new Response(
      JSON.stringify({ ok: false, source, error: String(error), enriched: done, skipped }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
