/**
 * Deno twin of src/lib/indexable.ts — keep both in sync.
 * URL scheme: NL on root with localized slugs, other locales under /en, /de, /fr.
 */

/**
 * Core pages, localized.
 *
 * Gemeten in Search Console op 25-09-2026: van de veertien bekende URL's is
 * er een geindexeerd en staan er dertien op "Discovered - currently not
 * indexed", alle met "last crawled: N/A". Negen daarvan zijn de /en/, /de/ en
 * /fr/ varianten; Google heeft ze sinds 5 augustus gezien en consequent niet
 * opgehaald. Vertalingen zonder eigen inhoud op een domein zonder
 * geschiedenis leveren geen crawl op maar wel een signaal van dunne
 * duplicaten.
 *
 * Daarom staat alleen Nederlands in de index, gelijk aan de keuze bij de
 * waardepagina's. De andere talen blijven gewoon bereikbaar. Terugzetten is
 * deze ene lijst.
 */
export const ACTIVE_LOCALES: readonly string[] = ['nl'];

const ALL_LOCALIZED_PATHS: Record<string, readonly string[]> = {
  nl: ['/', '/scan-je-platen', '/waarde-van-je-platen'],
  en: ['/en', '/en/scan-your-records', '/en/record-value'],
  de: ['/de', '/de/schallplatten-scannen', '/de/schallplatten-wert'],
  fr: ['/fr', '/fr/scanner-vos-disques', '/fr/valeur-de-vos-disques'],
};

export const LOCALIZED_INDEXABLE_PATHS = ACTIVE_LOCALES.flatMap(
  (l) => ALL_LOCALIZED_PATHS[l] ?? [],
);

/** Trust pages (single language, self-canonical, no hreflang). */
/** Hubs boven de waardepagina's; de enige gecrawlde ingang naar de albums. */
export const VALUE_HUB_PATHS = ['/waarde/lp', '/waarde/cd'] as const;

export const TRUST_INDEXABLE_PATHS = ['/privacy', '/terms'] as const;

/** Alias that stays crawlable but canonicalizes to the NL scan page. */
export const ALIAS_INDEXABLE_PATHS = ['/scanner'] as const;

export const INDEXABLE_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...VALUE_HUB_PATHS,
  ...TRUST_INDEXABLE_PATHS,
  ...ALIAS_INDEXABLE_PATHS,
];

/** Only these go into sitemap-static.xml (aliases are excluded). */
export const SITEMAP_PATHS = [
  ...LOCALIZED_INDEXABLE_PATHS,
  ...VALUE_HUB_PATHS,
  ...TRUST_INDEXABLE_PATHS,
];

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function isIndexablePath(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(normalizePath(pathname));
}
