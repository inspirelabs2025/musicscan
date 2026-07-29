/**
 * Deno twin of src/lib/indexable.ts — keep both in sync.
 */
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

/** Trust pages (single language, self-canonical, no hreflang). */
export const TRUST_INDEXABLE_PATHS = ['/privacy', '/terms'] as const;

/** Alias that stays crawlable but canonicalizes to the NL scan page. */
export const ALIAS_INDEXABLE_PATHS = ['/scanner'] as const;

export const INDEXABLE_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...TRUST_INDEXABLE_PATHS,
  ...ALIAS_INDEXABLE_PATHS,
] as const;

/** Only these go into sitemap-static.xml (aliases are excluded). */
export const SITEMAP_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...TRUST_INDEXABLE_PATHS,
] as const;

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function isIndexablePath(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(normalizePath(pathname));
}
