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
  const fallbackOrigin = 'https://musicscan.app';
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : fallbackOrigin;

  if (!pathOrUrl) return origin;

  try {
    return new URL(pathOrUrl, origin).toString();
  } catch {
    return origin;
  }
}
