import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize URL for consistent canonical tags
export function normalizeUrl(path: string): string {
  // Add trailing slash (except for homepage)
  let normalized = path.replace(/\/$/, ''); // First remove any existing trailing slash
  if (normalized === '') {
    return '/'; // Homepage doesn't need trailing slash
  }
  return normalized + '/'; // Add trailing slash to all other paths
}

// Normalize full URL with domain
export function normalizeFullUrl(pathname: string): string {
  const normalized = normalizeUrl(pathname);
  return `https://www.musicscan.app${normalized}`;
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
