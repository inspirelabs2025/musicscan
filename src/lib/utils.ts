import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAiNudgeEnabled() {
  return import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge';
}

export function extractDiscogsIdFromUrl(input: string): number | null {
  const trimmedInput = input.trim();
  const releaseMatch = trimmedInput.match(/(?:discogs\.com\/(?:[^/]+\/)?release\/|\/release\/)(\d+)/i);

  if (releaseMatch?.[1]) {
    return Number(releaseMatch[1]);
  }

  const numericMatch = trimmedInput.match(/^\d+$/);
  return numericMatch ? Number(trimmedInput) : null;
}

export function getCookie(name: string) {
  if (typeof document === 'undefined') return null;

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
    ?.split('=')[1] ?? null;
}

export function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;

  const maxAge = Math.max(0, days * 24 * 60 * 60);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function normalizeFullUrl(pathOrUrl?: string) {
  // Canonical production origin — single source of truth lives in src/config/site.ts.
  const canonicalOrigin = SITE_URL;
  const runtimeOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : canonicalOrigin;

  // Force the canonical origin for every host we own (old domain, new domain and
  // the Lovable preview/published subdomains) so SEO output never varies by host.
  const runtimeHost = new URL(runtimeOrigin).hostname;
  const isOwnHost = /(^|\.)musicscans\.com$/i.test(runtimeHost)
    || /(^|\.)musicscan\.app$/i.test(runtimeHost)
    || /lovable\.app$/i.test(runtimeHost);
  const origin = isOwnHost ? canonicalOrigin : runtimeOrigin;

  if (!pathOrUrl) return origin;

  try {
    const resolved = new URL(pathOrUrl, origin);
    // Rewrite absolute URLs on any host we own to the canonical domain.
    if (/(^|\.)musicscans\.com$/i.test(resolved.hostname) || /(^|\.)musicscan\.app$/i.test(resolved.hostname)) {
      resolved.protocol = 'https:';
      resolved.hostname = new URL(canonicalOrigin).hostname;
    }
    return resolved.toString();
  } catch {
    return origin;
  }
}

