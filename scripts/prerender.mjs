/**
 * Prerender van de waardepagina's, na `vite build`.
 *
 * Waarom dit bestaat. Lovable levert voor elke route dezelfde index.html uit.
 * Google rendert JavaScript en ziet de waardepagina's daardoor gewoon, maar
 * Bing, DuckDuckGo en de AI-crawlers doen dat niet: die zien 25 keer dezelfde
 * lege schil met dezelfde titel. De SSR-proxy die dat zou oplossen zit achter
 * een Cloudflare-worker die niet op de apex draait, en dat blijft voorlopig zo.
 *
 * Dit script lost het op in de build in plaats van aan de edge: het schrijft
 * per waardepagina een echt HTML-bestand naar dist/, met de juiste titel,
 * beschrijving, canonical, structured data en leesbare body-inhoud. De React-
 * app hydrateert er daarna overheen, dus bezoekers merken er niets van.
 *
 * Naast de albums en de hubs krijgen ook /scan-je-platen en
 * /waarde-van-je-platen een eigen HTML-bestand: die pagina's zijn de ingang
 * naar de rest, en zonder voorrendering zagen crawlers daar nul woorden en
 * nul links. En dist/sitemap.xml krijgt per waardepagina de lastmod uit
 * price_changed_at, zodat een prijswijziging ook echt als wijziging telt.
 *
 * De teksten komen uit dezelfde bestanden als de React-pagina's en de proxy:
 * value-page.ts voor de albums, src/content/waardeHubCopy.ts voor de hubs en
 * src/i18n/coreSeo.ts voor de landingspagina's. Eén bron, geen tweede versie
 * die stilletjes uit de pas gaat lopen.
 *
 * Het script mag de build nooit breken. Alles zit in een try/catch en eindigt
 * met exit 0; faalt het, dan verschijnt er een waarschuwing en staat de site
 * er gewoon zoals hij er zonder dit script ook had gestaan.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const TMP = path.join(ROOT, '.prerender');
const SOURCE = 'scripts/prerender-entry.ts';
const SITE = 'https://musicscans.com';
const SIBLING_LIMIT = 6;

const warn = (msg) => console.warn(`[prerender] ${msg}`);
const info = (msg) => console.log(`[prerender] ${msg}`);

/** Credentials uit de gegenereerde client halen; niet nog eens opschrijven. */
async function supabaseConfig() {
  const src = await readFile(path.join(ROOT, 'src/integrations/supabase/client.ts'), 'utf8');
  const url = src.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
  const key = src.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*"([^"]+)"/)?.[1];
  if (!url || !key) throw new Error('kon Supabase-URL of -sleutel niet uit client.ts lezen');
  return { url, key };
}

/**
 * value-page.ts is platte TypeScript zonder imports, dus vite kan er een los
 * ESM-bestand van bakken dat we hier gewoon importeren.
 */
async function loadRenderer() {
  const { build } = await import('vite');
  await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir: TMP,
      emptyOutDir: true,
      minify: false,
      lib: { entry: path.join(ROOT, SOURCE), formats: ['es'], fileName: () => 'value-page.mjs' },
    },
  });
  return import(path.join(TMP, 'value-page.mjs'));
}

async function fetchRows({ url, key }) {
  const endpoint = `${url}/rest/v1/value_pages?select=*`;
  const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`value_pages gaf ${res.status}`);
  return res.json();
}

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * De gebouwde index.html hergebruiken als schil, met de kop vervangen en de
 * body in #root gezet. Zo blijven alle scripttags en hashes intact.
 */
function renderPage(shell, { title, description, canonical, body, jsonLd }) {
  let html = shell;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
  );

  const head = [
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
    `<meta name="robots" content="index, follow" />`,
    ...(jsonLd ? [`<script type="application/ld+json">${jsonLd}</script>`] : []),
  ].join('\n    ');
  html = html.replace('</head>', `    ${head}\n  </head>`);

  html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${body}</div>`);
  return html;
}

/**
 * Twee schrijfwijzen, omdat we niet weten hoe de host van Lovable een pad
 * zonder extensie oplost: <pad>/index.html voor een directory-index, en
 * <pad>.html voor de "clean URLs"-variant. Beide dragen dezelfde canonical,
 * dus wat er ook wordt uitgeleverd, er ontstaat geen dubbele URL in de index.
 */
async function writePage(routePath, html) {
  const rel = routePath.replace(/^\//, '');
  await mkdir(path.join(DIST, rel), { recursive: true });
  await writeFile(path.join(DIST, rel, 'index.html'), html, 'utf8');
  await mkdir(path.dirname(path.join(DIST, `${rel}.html`)), { recursive: true });
  await writeFile(path.join(DIST, `${rel}.html`), html, 'utf8');
}

const albumUrl = (r) => `${SITE}/waarde/${r.artist_slug}/${r.album_slug}`;

const faqLd = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const itemListLd = (mod, rows) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: albumUrl(r), name: `${r.album_title} – ${r.artist}` })),
});

const toNum = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};
const eur = (v) => '€' + v.toFixed(2).replace('.', ',').replace(/,00$/, ',–');

/** Dezelfde lijst als ValuePageLinks in React: alle albums, met de afgeronde mediaan. */
function albumList(mod, rows) {
  const items = rows
    .map((r) => {
      const lo = toNum(r.price_range_min);
      const hi = toNum(r.price_range_max);
      const med = toNum(r.price_median);
      const price = med !== null ? ` — meestal rond ${eur(mod.roundMedian(med, lo, hi))}` : '';
      return `<li><a href="${albumUrl(r)}">${escapeText(r.album_title)} – ${escapeText(r.artist)}</a>${escapeText(price)}</li>`;
    })
    .join('');
  return `<ul>${items}</ul>`;
}

const faqHtml = (title, faq) =>
  `<section><h2>${escapeText(title)}</h2>` +
  faq.map((f) => `<h3>${escapeText(f.q)}</h3><p>${escapeText(f.a)}</p>`).join('') +
  `</section>`;

function renderHub(mod, slug, copy, rows) {
  const other = slug === 'lp' ? 'cd' : 'lp';
  return (
    `<div data-ssr="waarde-hub">` +
    `<nav aria-label="kruimelpad"><a href="${SITE}/">MusicScan</a> &rsaquo; <a href="${SITE}/waarde-van-je-platen">Waarde van je platen</a> &rsaquo; <span>${escapeText(copy.h1)}</span></nav>` +
    `<h1>${escapeText(copy.h1)}</h1>` +
    copy.intro.map((p) => `<p>${escapeText(p)}</p>`).join('') +
    copy.sections.map((s) => `<section><h2>${escapeText(s.h)}</h2>${s.p.map((p) => `<p>${escapeText(p)}</p>`).join('')}</section>`).join('') +
    `<section><h2>${escapeText(copy.linksHeading)}</h2>${albumList(mod, rows)}</section>` +
    faqHtml('Veelgestelde vragen', copy.faq) +
    `<p>Ook handig: <a href="${SITE}/waarde/${other}">wat is je ${other} waard</a> en <a href="${SITE}/waarde-van-je-platen">de waarde van je platencollectie</a>.</p>` +
    `</div>`
  );
}

function renderLanding(mod, key, copy, rows) {
  const parts = [`<h1>${escapeText(copy.heading)}</h1>`, `<p>${escapeText(copy.intro)}</p>`];
  parts.push(...copy.steps.map((s) => `<section><h2>${escapeText(s.title)}</h2><p>${escapeText(s.body)}</p></section>`));
  if (key === 'value') {
    parts.push(
      `<section><h2>Wat is jouw drager waard?</h2><p>De prijs hangt af van de persing en de conditie, niet van het album. ` +
        `<a href="${SITE}/waarde/lp">Bij lp's</a> bepalen catalogusnummer en matrixcode het verschil, ` +
        `<a href="${SITE}/waarde/cd">bij cd's</a> oplage en persland.</p>${albumList(mod, rows)}</section>`,
    );
    parts.push(`<p><a href="${SITE}/scan-je-platen">Zo werkt het scannen van je platen</a></p>`);
  } else {
    parts.push(
      `<p><a href="${SITE}/waarde-van-je-platen">Ontdek wat je platen waard zijn</a>, of kijk direct wat ` +
        `<a href="${SITE}/waarde/lp">je lp</a> of <a href="${SITE}/waarde/cd">je cd</a> waard is.</p>`,
    );
  }
  parts.push(faqHtml(copy.faqTitle, copy.faq));
  return `<div data-ssr="landing-${key}">${parts.join('')}</div>`;
}

/**
 * De sitemap uit public/ is al door vite naar dist/ gekopieerd. Hier krijgen de
 * waardepagina's hun lastmod uit price_changed_at: de dag dat de vork echt
 * bewoog, niet de dag dat we keken. De hubs en de pijlerpagina tonen alle
 * albums met hun prijs, dus die nemen de laatste wijziging van allemaal over.
 */
async function writeSitemap(rows) {
  const file = path.join(DIST, 'sitemap.xml');
  if (!existsSync(file)) {
    warn('geen dist/sitemap.xml, lastmod niet bijgewerkt');
    return;
  }
  const day = (iso) => (iso ? String(iso).slice(0, 10) : null);
  const byUrl = new Map(rows.map((r) => [albumUrl(r), day(r.price_changed_at) || day(r.priced_at)]));
  const latest = [...byUrl.values()].filter(Boolean).sort().pop();
  for (const u of [`${SITE}/waarde/lp`, `${SITE}/waarde/cd`, `${SITE}/waarde-van-je-platen`]) {
    if (latest) byUrl.set(u, latest);
  }
  let xml = await readFile(file, 'utf8');
  let changed = 0;
  xml = xml.replace(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g, (m, loc, lastmod) => {
    const next = byUrl.get(loc.trim());
    if (!next || next <= lastmod) return m;
    changed += 1;
    return m.replace(`<lastmod>${lastmod}</lastmod>`, `<lastmod>${next}</lastmod>`);
  });
  await writeFile(file, xml, 'utf8');
  info(`sitemap: ${changed} lastmod bijgewerkt`);
}

async function main() {
  if (!existsSync(DIST)) {
    warn('geen dist/, niets te doen');
    return;
  }
  const shell = await readFile(path.join(DIST, 'index.html'), 'utf8');
  if (!/<div id="root">\s*<\/div>/.test(shell)) {
    warn('#root niet gevonden in dist/index.html — overgeslagen');
    return;
  }

  const mod = await loadRenderer();
  const rows = await fetchRows(await supabaseConfig());
  const indexable = rows.filter((r) => mod.isIndexable(r, 'nl'));
  if (!indexable.length) {
    warn('geen indexeerbare rijen — overgeslagen');
    return;
  }

  let written = 0;
  const links = [...indexable].sort(mod.compareAlbums);

  for (const row of indexable) {
    const siblings = mod.pickSiblings(indexable, row, SIBLING_LIMIT).map((r) => ({
      artist_slug: r.artist_slug,
      album_slug: r.album_slug,
      artist: r.artist,
      album_title: r.album_title,
    }));
    const route = `/waarde/${row.artist_slug}/${row.album_slug}`;
    await writePage(
      route,
      renderPage(shell, {
        title: mod.valueTitle(row, 'nl'),
        description: mod.valueDescription(row, 'nl'),
        canonical: mod.valuePath(row, 'nl'),
        body: mod.renderValueBody(row, 'nl', siblings),
        jsonLd: mod.valueJsonLd(row, 'nl'),
      }),
    );
    written += 1;
  }

  for (const slug of mod.HUB_SLUGS) {
    const copy = mod.WAARDE_HUB_COPY[slug];
    const canonical = mod.hubPath(slug);
    await writePage(
      `/waarde/${slug}`,
      renderPage(shell, {
        title: copy.title,
        description: copy.description,
        canonical,
        body: renderHub(mod, slug, copy, links),
        jsonLd: JSON.stringify([faqLd(copy.faq), itemListLd(mod, links)]),
      }),
    );
    written += 1;
  }

  for (const key of ['scan', 'value']) {
    const seo = mod.CORE_SEO[key].nl;
    const copy = key === 'scan' ? mod.SCAN_COPY.nl : mod.VALUE_COPY.nl;
    const route = key === 'scan' ? '/scan-je-platen' : '/waarde-van-je-platen';
    await writePage(
      route,
      renderPage(shell, {
        title: seo.title,
        description: seo.description,
        canonical: `${SITE}${route}`,
        body: renderLanding(mod, key, copy, links),
        jsonLd: JSON.stringify([faqLd(copy.faq), ...(key === 'value' ? [itemListLd(mod, links)] : [])]),
      }),
    );
    written += 1;
  }

  try {
    await writeSitemap(indexable);
  } catch (error) {
    warn(`sitemap niet bijgewerkt: ${error && error.message ? error.message : error}`);
  }

  await rm(TMP, { recursive: true, force: true });
  info(`${written} pagina's voorgerenderd`);
}

try {
  await main();
} catch (error) {
  warn(`overgeslagen: ${error && error.message ? error.message : error}`);
}
process.exit(0);
