import { useState, useEffect, useCallback, useRef } from 'react';

// This gets baked in at build time
const BUILD_VERSION = document.querySelector('meta[name="build-version"]')?.getAttribute('content') || '';

export const useVersionCheck = (intervalMs = 5 * 60 * 1000) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const mismatchCount = useRef(0);

  const checkVersion = useCallback(async () => {
    try {
      const resp = await fetch(`/index.html?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!resp.ok) return;
      const html = await resp.text();
      const match = html.match(/name="build-version"\s+content="([^"]+)"/);
      if (!match?.[1] || !BUILD_VERSION) return;

      if (match[1] !== BUILD_VERSION) {
        mismatchCount.current += 1;
        setUpdateAvailable(true);

        // Auto-reload after 3 consecutive mismatches
        if (mismatchCount.current >= 3) {
          window.location.reload();
        }
      } else {
        mismatchCount.current = 0;
        setUpdateAvailable(false);
      }
    } catch {
      // Network error — ignore
    }
  }, []);

  useEffect(() => {
    // First check after 30s (give page time to settle)
    const initial = setTimeout(checkVersion, 30_000);
    const interval = setInterval(checkVersion, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [checkVersion, intervalMs]);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  return { updateAvailable, refresh };
};
