import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
