import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely gets an item from localStorage.
 * @param key The key to retrieve.
 * @returns The stored value or null if not found/error.
 */
export function localStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error getting item from localStorage:', error);
    return null;
  }
}

/**
 * Safely sets an item in localStorage.
 * @param key The key to set.
 * @param value The value to store.
 */
export function localStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting item in localStorage:', error);
  }
}
