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
  // Canonical production origin — always the www-variant to keep canonical,
  // og:url, twitter:image and sitemap URLs consistent with Search Console.
  const canonicalOrigin = 'https://musicscans.com';
  const runtimeOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : canonicalOrigin;

  // Force the canonical origin for any musicscan.app host (with or without www)
  // and for the Lovable preview/published subdomains — so SEO output never
  // varies by where the app happens to be served from.
  const isMusicScanHost = /(^|\.)musicscan\.app$/i.test(new URL(runtimeOrigin).hostname)
    || /lovable\.app$/i.test(new URL(runtimeOrigin).hostname);
  const origin = isMusicScanHost ? canonicalOrigin : runtimeOrigin;

  if (!pathOrUrl) return origin;

  try {
    const resolved = new URL(pathOrUrl, origin);
    // If the input was an absolute URL on a musicscan.app host, rewrite to www.
    if (/(^|\.)musicscan\.app$/i.test(resolved.hostname)) {
      resolved.protocol = 'https:';
      resolved.hostname = 'www.musicscan.app';
    }
    return resolved.toString();
  } catch {
    return origin;
  }
}
