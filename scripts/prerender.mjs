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
 * De teksten komen uit supabase/functions/universal-ssr-proxy/value-page.ts —
 * hetzelfde bestand dat de proxy gebruikt. Eén bron, geen tweede versie die
 * stilletjes uit de pas gaat lopen.
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
const SOURCE = 'supabase/functions/universal-ssr-proxy/value-page.ts';
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

  for (const row of indexable) {
    const siblings = indexable
      .filter((r) => r.group_slug !== row.group_slug)
      .slice(0, SIBLING_LIMIT)
      .map((r) => ({
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
    const rowsForHub = indexable.filter((r) => mod.hubForRow(r) === slug);
    await writePage(
      `/waarde/${slug}`,
      renderPage(shell, {
        title: mod.hubTitle(slug),
        description: mod.hubDescription(slug),
        canonical: mod.hubPath(slug),
        body: mod.renderHubBody(slug, rowsForHub),
        jsonLd: null,
      }),
    );
    written += 1;
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
