/**
 * Single source of truth for indexation.
 *
 * Only the core "scan your records + discover the value" pages plus the legal
 * trust pages are indexable. Everything else (stories, singles, news, catalog,
 * shop, hubs, admin, ...) gets `noindex, follow`.
 */

export const INDEXABLE_PATHS = ['/', '/scanner', '/privacy', '/terms'] as const;

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function isIndexablePath(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(normalizePath(pathname));
}
