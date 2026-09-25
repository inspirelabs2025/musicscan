/**
 * Single source of truth for indexation.
 *
 * Only the core "scan your records + discover the value" pages (in all four
 * languages) plus the legal trust pages are indexable. Everything else
 * (stories, singles, news, catalog, shop, hubs, admin, ...) gets
 * `noindex, follow`.
 *
 * URL scheme: Dutch (default locale) lives on the root with localized slugs,
 * the other languages live under a locale prefix: /en/..., /de/..., /fr/...
 */

/** Core pages, localized. These are the URLs that go into the sitemap. */
export const LOCALIZED_INDEXABLE_PATHS = [
  // home
  '/',
  '/en',
  '/de',
  '/fr',
  // scan
  '/scan-je-platen',
  '/en/scan-your-records',
  '/de/schallplatten-scannen',
  '/fr/scanner-vos-disques',
  // value
  '/waarde-van-je-platen',
  '/en/record-value',
  '/de/schallplatten-wert',
  '/fr/valeur-de-vos-disques',
] as const;

/**
 * Hubs boven de waardepagina's. Deze zijn bewust wél in de statische sitemap
 * opgenomen: ze zijn de enige gecrawlde ingang naar de albumpagina's, en
 * zonder interne links komt Google daar niet.
 */
export const VALUE_HUB_PATHS = ['/waarde/lp', '/waarde/cd'] as const;

/** Trust pages (single language, self-canonical, no hreflang). */
export const TRUST_INDEXABLE_PATHS = ['/privacy', '/terms'] as const;

/**
 * Waardepagina's per album: /waarde/{artiest}/{album} en de vertaalde paden.
 * Dit zijn er te veel voor een allowlist, dus ze matchen op patroon. Of een
 * losse pagina daadwerkelijk index,follow krijgt hangt af van de prijsvork:
 * de pagina zelf zet noindex zolang die ontbreekt.
 */
const VALUE_PATH_RE = /^\/(?:(?:en|de|fr)\/)?(?:waarde|value|wert|valeur)\/[^/]+\/[^/]+$/;

/**
 * Welke taal van de waardepagina's in de index mag. Bewust één taal bij de
 * start: twee URL's per album verdubbelt het aantal dunne pagina's op een
 * domein dat zich nog moet bewijzen. Zet 'en' erbij zodra de Nederlandse
 * lichting aantoonbaar gecrawld wordt.
 */
export const INDEXABLE_VALUE_LOCALES: readonly string[] = ['nl'];

export function isValuePath(pathname: string): boolean {
  return VALUE_PATH_RE.test(normalizePath(pathname));
}

/** Alias that stays crawlable but canonicalizes to the NL scan page. */
export const ALIAS_INDEXABLE_PATHS = ['/scanner'] as const;

export const INDEXABLE_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...VALUE_HUB_PATHS,
  ...TRUST_INDEXABLE_PATHS,
  ...ALIAS_INDEXABLE_PATHS,
] as const;

/** Only these go into sitemap-static.xml (aliases are excluded). */
export const SITEMAP_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...VALUE_HUB_PATHS,
  ...TRUST_INDEXABLE_PATHS,
] as const;

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function isIndexablePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (INDEXABLE_PATHS as readonly string[]).includes(path) || isValuePath(path);
}
