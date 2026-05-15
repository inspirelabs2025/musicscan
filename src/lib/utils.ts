import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAiNudgeEnabled() {
  return import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge';
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
