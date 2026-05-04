import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { selectiveReset, appBuildKey } from '@/utils/appReset';
import { getBuildVersion } from '@/hooks/useVersionCheck';

/**
 * Silent app version check.
 *
 * On every app start, compares the current build timestamp with the one
 * we last wrote to localStorage. If different (i.e. user just installed
 * a fresh AAB), do a selective reset to drop volatile caches that could
 * be holding stale data — but keep the user logged in and language preferred.
 *
 * The hardReset path is intentionally separate; this one is silent and
 * runs every cold start.
 */
export function useAppVersionCheck(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const current = getBuildVersion();
      // Avoid running in the dev/preview environment where the version is 'dev'
      // and would cause continuous resets on every reload.
      if (!current || current === 'dev') return;

      let stored: string | null = null;
      try {
        stored = localStorage.getItem(appBuildKey);
      } catch {
        // localStorage unavailable — bail
        return;
      }

      if (stored === current) return; // Same build, nothing to do

      // First run on this device, or fresh install detected.
      if (stored !== null) {
        // Existing user upgrading — wipe volatile caches.
        try {
          await selectiveReset(queryClient);
        } catch (e) {
          console.warn('[useAppVersionCheck] selectiveReset failed', e);
        }
      }

      if (!cancelled) {
        try {
          localStorage.setItem(appBuildKey, current);
        } catch {
          /* ignore */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);
}
