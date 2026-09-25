/**
 * MusicScan edge worker
 * ---------------------
 * Draait op de Cloudflare-zone vóór de origin (Lovable-hosting).
 * Reden: het hostingplatform leest noch vercel.json, noch public/_redirects,
 * waardoor de SSR-proxy en de dynamische sitemaps nooit bereikt werden.
 *
 * Deze worker doet vier dingen:
 *   1. sitemaps en feeds doorzetten naar de Supabase edge functions
 *   2. crawlers op contentpaden naar de universal-ssr-proxy sturen
 *   3. de legacy-redirects uitvoeren die in _redirects staan maar niet werken
 *   4. al het overige onaangeroerd naar de origin laten gaan
 */

const FN = 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1';

/** Contenttypes die de SSR-proxy kan renderen. Volgorde doet er niet toe. */
const SSR_TYPES = [
  'plaat-verhaal', 'muziek-verhaal', 'singles', 'artists', 'artist-spotlight',
  'anekdotes', 'nieuws', 'new-release', 'nummer',
  'waarde', 'value', 'wert', 'valeur',        // de waardepagina's, per taal
];

/** Crawlers. Bewust ruim: liever een mens de geïnjecteerde HTML dan een bot de lege shell. */
const BOT = new RegExp([
  'googlebot', 'google-inspectiontool', 'storebot-google', 'bingbot', 'slurp',
  'duckduckbot', 'baiduspider', 'yandex', 'applebot', 'petalbot', 'seznambot',
  'facebookexternalhit', 'linkedinbot', 'twitterbot', 'whatsapp', 'telegrambot',
  'discordbot', 'slackbot', 'pinterest', 'redditbot',
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'perplexitybot', 'claudebot',
  'anthropic-ai', 'ccbot', 'bytespider', 'amazonbot', 'meta-externalagent',
  'bot', 'crawler', 'spider',
].join('|'), 'i');

/** Vaste paden die rechtstreeks een edge function zijn. */
const EXACT = new Map([
  ['/sitemap.xml',          `${FN}/sitemap-proxy?file=sitemap-index.xml`],
  ['/sitemap-llm.xml',      `${FN}/generate-llm-sitemap`],
  ['/sitemap-podcasts.xml', `${FN}/generate-podcast-sitemap`],
]);

/** Legacy-redirects uit _redirects die op dit platform niet werken. */
const REDIRECTS = [
  [/^\/product\/.+$/, '/art-shop'],
  [/^\/art-prints\/?$/, '/shop'],
  [/^\/blog\/(.+)$/, '/plaat-verhaal/$1'],
];

/** Paden waar een afsluitende slash weg moet (canonicalisatie). */
const TRAILING_SLASH = new RegExp(`^/(${SSR_TYPES.join('|')}|reviews|shop)/(.+)/$`);

async function proxy(target, request) {
  const res = await fetch(target, {
    headers: {
      'user-agent': request.headers.get('user-agent') || '',
      'accept': request.headers.get('accept') || '*/*',
      'accept-language': request.headers.get('accept-language') || '',
    },
    redirect: 'manual',
  });
  // Status en content-type van de function overnemen, inclusief 404 en 301.
  const out = new Response(res.body, res);
  out.headers.set('x-musicscan-edge', 'worker');
  return out;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/{2,}/g, '/');

    // 1 — www en afsluitende slash normaliseren
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    const ts = path.match(TRAILING_SLASH);
    if (ts) {
      url.pathname = path.slice(0, -1);
      return Response.redirect(url.toString(), 301);
    }

    // 2 — legacy-redirects
    for (const [re, to] of REDIRECTS) {
      const m = path.match(re);
      if (m) {
        url.pathname = to.replace('$1', m[1] ?? '');
        return Response.redirect(url.toString(), 301);
      }
    }

    // 3 — sitemaps en feeds
    if (EXACT.has(path)) return proxy(EXACT.get(path), request);
    if (path.startsWith('/sitemaps/') || path.startsWith('/sm/')) {
      const file = path.split('/').slice(2).join('/');
      return proxy(`${FN}/sitemap-proxy?file=${encodeURIComponent(file)}`, request);
    }
    const feed = path.match(/^\/feeds\/podcast\/(.+)\.xml$/);
    if (feed) return proxy(`${FN}/feeds-podcast?slug=${encodeURIComponent(feed[1])}`, request);
    const llm = path.match(/^\/api\/llm\/([^/]+)\/(.+)\.md$/);
    if (llm) return proxy(`${FN}/llm-content/${llm[1]}/${llm[2]}`, request);

    // 4 — crawlers op contentpaden naar de SSR-proxy
    const ua = request.headers.get('user-agent') || '';
    const seg = path.split('/').filter(Boolean);
    const type = seg.length >= 2 ? seg[0] : null;
    const localized = seg.length >= 3 && ['nl', 'en', 'de', 'fr'].includes(seg[0]);
    const contentType = localized ? seg[1] : type;

    if (contentType && SSR_TYPES.includes(contentType) && BOT.test(ua)) {
      return proxy(`${FN}/universal-ssr-proxy${path}`, request);
    }

    // 5 — al het overige gewoon naar de origin
    return fetch(request);
  },
};
