import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0)
      return c.substring(nameEQ.length, c.length);
  }
  return undefined;
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + "=" + value + ";expires=" + expires.toUTCString() + ";path=/";
}

export function extractDiscogsIdFromUrl(input: string): number | null {
  if (!input) return null;
  const match = input.match(/\/release\/(\d+)/);
  if (match) return parseInt(match[1], 10);
  const masterMatch = input.match(/\/master\/(\d+)/);
  if (masterMatch) return parseInt(masterMatch[1], 10);
  return null;
}

export function normalizeFullUrl(pathname: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.musicscan.app';
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return `${baseUrl}${cleanPath}`;
}
