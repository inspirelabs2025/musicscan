import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add new utility or existing for local storage management specific to growth features
// This is an example of an additional utility, but for this PR, `chat-promotion-banner.tsx` handles its own local storage.
// export const setLocalStorageItem = (key: string, value: string) => {
//   if (typeof window !== 'undefined') {
//     localStorage.setItem(key, value);
//   }
// };

// export const getLocalStorageItem = (key: string): string | null => {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem(key);
//   }
//   return null;
// };
