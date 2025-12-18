import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Canonical domain - ALWAYS use www.musicscan.app
export const CANONICAL_DOMAIN = 'https://www.musicscan.app';

// Normalize URL for consistent canonical tags
export function normalizeUrl(path: string): string {
  // Remove trailing slash for consistency with SSR proxy (except homepage)
  let normalized = path.replace(/\/$/, '') || '/';
  // Ensure path starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized;
}

// Normalize full URL with domain - ALWAYS returns https://www.musicscan.app/path
export function normalizeFullUrl(pathname: string): string {
  const normalized = normalizeUrl(pathname);
  return `${CANONICAL_DOMAIN}${normalized}`;
}

// Generate canonical URL for any path - use this everywhere
export function getCanonicalUrl(path: string): string {
  return normalizeFullUrl(path);
}

// Extract Discogs ID from URL as fallback
export function extractDiscogsIdFromUrl(url: string | null): number | null {
  if (!url) return null;
  
  // Match patterns like:
  // https://www.discogs.com/release/588618
  // https://discogs.com/release/588618-artist-title
  // /release/588618
  const match = url.match(/release\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
