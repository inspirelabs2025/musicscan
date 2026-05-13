import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAiNudgeEnabled() {
  return import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge';
}
