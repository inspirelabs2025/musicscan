/**
 * Central site configuration.
 *
 * Single source of truth for the production domain, the supported locales,
 * the (few) pages we actually want indexed and the app store links.
 * Change the domain here and everywhere in the frontend follows.
 */

import { isIndexablePath as isAllowlistedPath } from '@/lib/indexable';

export const SITE_URL = 'https://musicscans.com';
export const SITE_NAME = 'MusicScan';

export const LOCALES = ['nl', 'en', 'de', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

export const OG_LOCALE: Record<Locale, string> = {
  nl: 'nl_NL',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
};

/** The only page types we want in the index: scan + value proposition. */
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

export const CORE_PAGE_KEYS = Object.keys(CORE_SLUGS) as CorePageKey[];

/** Trust pages: indexable, but low priority and not localized. */
export const TRUST_PATHS = ['/over-ons', '/privacy', '/voorwaarden'];

/** Build the path for a core page in a given locale. NL lives on the root. */
export function corePath(key: CorePageKey, locale: Locale = DEFAULT_LOCALE): string {
  const slug = CORE_SLUGS[key][locale];
  if (locale === DEFAULT_LOCALE) return slug ? `/${slug}` : '/';
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/** Reverse lookup: which core page (and locale) does this path represent? */
export function matchCorePath(pathname: string): { key: CorePageKey; locale: Locale } | null {
  const path = normalizePath(pathname);
  for (const key of CORE_PAGE_KEYS) {
    for (const locale of LOCALES) {
      if (corePath(key, locale) === path) return { key, locale };
    }
  }
  return null;
}

/** Locale implied by the URL prefix (falls back to the default locale). */
export function localeFromPath(pathname: string): Locale {
  const first = normalizePath(pathname).split('/')[1];
  return (LOCALES as readonly string[]).includes(first) ? (first as Locale) : DEFAULT_LOCALE;
}

/**
 * True when the page is on the indexation allowlist.
 * The allowlist itself lives in src/lib/indexable.ts (single source of truth).
 */
export function isIndexablePath(pathname: string): boolean {
  return isAllowlistedPath(normalizePath(pathname));
}

/**
 * Crawlable aliases that must not compete with the real localized URL.
 * They stay reachable and index,follow, but canonicalize to their target.
 */
const PATH_ALIASES: Record<string, string> = {
  '/scanner': corePath('scan', DEFAULT_LOCALE),
};

/** The URL a path should canonicalize to (itself, unless it is an alias). */
export function canonicalPathFor(pathname: string): string {
  const path = normalizePath(pathname);
  return PATH_ALIASES[path] ?? path;
}

/** hreflang alternates for a core page; empty for everything else. */
export function hreflangAlternates(pathname: string): Array<{ hreflang: string; href: string }> {
  const match = matchCorePath(canonicalPathFor(pathname));
  if (!match) return [];
  const alternates: Array<{ hreflang: string; href: string }> = LOCALES.map((locale) => ({
    hreflang: locale as string,
    href: `${SITE_URL}${corePath(match.key, locale)}`.replace(/\/$/, '') || SITE_URL,
  }));
  alternates.push({
    hreflang: 'x-default',
    href: `${SITE_URL}${corePath(match.key, DEFAULT_LOCALE)}`.replace(/\/$/, '') || SITE_URL,
  });
  return alternates;
}


/** App + web links. iOS is not live yet — keep it disabled until it is. */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.inspirelabs.musicscan';
export const APP_STORE_URL = 'https://apps.apple.com/app/musicscan/id6739262838';
export const APP_STORE_AVAILABLE = false;
export const WEB_APP_URL = `${SITE_URL}/scan`;
