/**
 * Central site configuration for edge functions.
 * Keep in sync with src/config/site.ts.
 */

export const SITE_URL = 'https://musicscans.com';
export const SITE_NAME = 'MusicScan';

export const LOCALES = ['nl', 'en', 'de', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

export type CorePageKey = 'home' | 'scan' | 'value' | 'app' | 'pricing';

export const CORE_SLUGS: Record<CorePageKey, Record<Locale, string>> = {
  home: { nl: '', en: '', de: '', fr: '' },
  scan: {
    nl: 'scan-je-platen',
    en: 'scan-your-records',
    de: 'schallplatten-scannen',
    fr: 'scanner-vos-disques',
  },
  value: {
    nl: 'waarde-van-je-platen',
    en: 'record-value',
    de: 'schallplatten-wert',
    fr: 'valeur-de-vos-disques',
  },
  app: { nl: 'app', en: 'app', de: 'app', fr: 'app' },
  pricing: { nl: 'prijzen', en: 'pricing', de: 'preise', fr: 'tarifs' },
};

export const TRUST_PATHS = ['/over-ons', '/privacy', '/voorwaarden'];

export function corePath(key: CorePageKey, locale: Locale = DEFAULT_LOCALE): string {
  const slug = CORE_SLUGS[key][locale];
  if (locale === DEFAULT_LOCALE) return slug ? `/${slug}` : '/';
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

export function coreUrl(key: CorePageKey, locale: Locale = DEFAULT_LOCALE): string {
  const path = corePath(key, locale);
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

export function allCoreUrls(): Array<{ key: CorePageKey; locale: Locale; url: string }> {
  const out: Array<{ key: CorePageKey; locale: Locale; url: string }> = [];
  for (const key of Object.keys(CORE_SLUGS) as CorePageKey[]) {
    for (const locale of LOCALES) {
      out.push({ key, locale, url: coreUrl(key, locale) });
    }
  }
  return out;
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/** True when this path is part of the indexable "scan + value" set. */
export function isIndexablePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (TRUST_PATHS.includes(path)) return true;
  for (const key of Object.keys(CORE_SLUGS) as CorePageKey[]) {
    for (const locale of LOCALES) {
      if (corePath(key, locale) === path) return true;
    }
  }
  return false;
}
