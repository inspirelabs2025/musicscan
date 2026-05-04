/**
 * App reset utilities for clearing client-side caches.
 *
 * Used to recover from corrupted/stale state in the Capacitor app
 * (e.g., after a major update where localStorage schemas changed,
 * or when a tester reports that the app behaves "weird").
 *
 * Two flavors:
 * - selectiveReset(): silent, only clears caches that are safe to drop.
 *   Auth tokens, language preference, and persistent user data stay.
 *   Used by useAppVersionCheck on app upgrade.
 *
 * - hardReset(): nuclear, wipes everything. Auth, language, all preferences.
 *   User has to log in and pick language again. Used by the "App resetten"
 *   button in the menu and by ?reset=hard URL parameter.
 */

import type { QueryClient } from '@tanstack/react-query';

const APP_BUILD_KEY = '__app_build_v';

// Keys that we never wipe in selectiveReset, even if version changed.
// These contain user data we want to preserve across app upgrades.
const PRESERVED_LOCALSTORAGE_KEYS = [
  'language',
  // Supabase auth tokens are typically prefixed with `sb-` and live under
  // their own key per project; we filter those by prefix below.
];

const PRESERVED_KEY_PREFIXES = [
  'sb-', // Supabase auth tokens
];

function shouldPreserve(key: string): boolean {
  if (PRESERVED_LOCALSTORAGE_KEYS.includes(key)) return true;
  return PRESERVED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Silent reset: drop volatile caches only.
 * Safe to call on every app upgrade — does NOT log out the user
 * and does NOT change language preference.
 */
export async function selectiveReset(queryClient?: QueryClient): Promise<void> {
  // 1. React Query cache (in-memory)
  if (queryClient) {
    try {
      queryClient.clear();
    } catch (e) {
      console.warn('[appReset] Failed to clear React Query cache', e);
    }
  }

  // 2. sessionStorage — always disposable
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('[appReset] Failed to clear sessionStorage', e);
  }

  // 3. Cache API (Service Worker caches, if any)
  if ('caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch (e) {
      console.warn('[appReset] Failed to clear Cache API', e);
    }
  }

  // 4. localStorage: only drop keys that aren't preserved
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (!shouldPreserve(key)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('[appReset] Failed selective localStorage prune', e);
  }
}

/**
 * Nuclear reset: wipe absolutely everything client-side.
 * After this call, the user is effectively a brand-new visitor.
 * Triggers a full page reload at the end.
 */
export async function hardReset(): Promise<void> {
  // 1. localStorage
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('[appReset:hard] localStorage', e);
  }

  // 2. sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('[appReset:hard] sessionStorage', e);
  }

  // 3. IndexedDB — drop all databases
  if (typeof indexedDB !== 'undefined') {
    try {
      // indexedDB.databases() is not available in every WebView; guard it.
      const dbsFn = (indexedDB as IDBFactory & { databases?: () => Promise<IDBDatabaseInfo[]> }).databases;
      if (typeof dbsFn === 'function') {
        const dbs = await dbsFn.call(indexedDB);
        await Promise.all(
          dbs
            .filter((db) => !!db.name)
            .map(
              (db) =>
                new Promise<void>((resolve) => {
                  const req = indexedDB.deleteDatabase(db.name as string);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                })
            )
        );
      }
    } catch (e) {
      console.warn('[appReset:hard] IndexedDB', e);
    }
  }

  // 4. Cache API
  if ('caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch (e) {
      console.warn('[appReset:hard] Cache API', e);
    }
  }

  // 5. Cookies for the current domain
  try {
    document.cookie.split(';').forEach((c) => {
      const eq = c.indexOf('=');
      const name = (eq > -1 ? c.substring(0, eq) : c).trim();
      if (!name) return;
      const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Try multiple domain/path combos to maximize wipe success
      document.cookie = `${name}=; ${expire}; path=/`;
      document.cookie = `${name}=; ${expire}; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}=; ${expire}; path=/; domain=.${window.location.hostname}`;
    });
  } catch (e) {
    console.warn('[appReset:hard] cookies', e);
  }

  // 6. Capacitor Preferences (only when running in native app)
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.clear();
    }
  } catch (e) {
    console.warn('[appReset:hard] Capacitor Preferences', e);
  }

  // 7. Service Worker unregister (if any)
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch (e) {
      console.warn('[appReset:hard] ServiceWorker unregister', e);
    }
  }

  // 8. Force reload, bypassing browser cache where possible.
  // NB: location.reload(true) is deprecated; the modern way is to navigate
  // to the same URL with a cache-busting query param.
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  url.searchParams.set('__cb', Date.now().toString());
  window.location.replace(url.toString());
}

export const appBuildKey = APP_BUILD_KEY;
