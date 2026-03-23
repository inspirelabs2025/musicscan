import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Cookie Utilities ---
export function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; Path=/; SameSite=Lax";
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function normalizeFullUrl(pathname: string): string {
  const base = 'https://www.musicscan.app';
  const clean = pathname.replace(/\/+$/, '') || '/';
  return `${base}${clean}`;
}

export function extractDiscogsIdFromUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = url.match(/\/release\/(\d+)/);
  if (match) return parseInt(match[1], 10);
  const match2 = url.match(/\/master\/(\d+)/);
  if (match2) return parseInt(match2[1], 10);
  return null;
}
