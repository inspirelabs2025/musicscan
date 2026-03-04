import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract a Discogs release/master ID from a URL or raw string
 */
export function extractDiscogsIdFromUrl(input: string | null | undefined): number | null {
  if (!input) return null;
  
  const str = input.toString().trim();
  
  // If it's just a number
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  
  // Try to extract from URL patterns like /release/12345 or /master/12345
  const match = str.match(/\/(release|master)\/(\d+)/);
  if (match) {
    return parseInt(match[2], 10);
  }
  
  return null;
}

/**
 * Normalize a path into a full canonical URL for musicscan.app
 */
export function normalizeFullUrl(path: string): string {
  const base = 'https://www.musicscan.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
