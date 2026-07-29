/**
 * Deno twin of src/lib/indexable.ts — keep both in sync.
 * Only these paths may be indexed; everything else is `noindex, follow`.
 */

export const INDEXABLE_PATHS = ['/', '/scanner', '/privacy', '/terms'] as const;

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function isIndexablePath(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(normalizePath(pathname));
}
