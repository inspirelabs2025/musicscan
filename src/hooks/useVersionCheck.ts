import { useState, useEffect, useCallback, useRef } from 'react';

// Injected at build time by Vite — unique per build
declare const __BUILD_TIMESTAMP__: string;
const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '';

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

      // Check for JS bundle hash change — if our current script src doesn't exist in new HTML
      const scriptMatch = html.match(/src="(\/src\/main\.tsx|\/assets\/index-[^"]+\.js)"/);
      const metaMatch = html.match(/name="build-version"\s+content="([^"]+)"/);
      
      if (metaMatch?.[1] && BUILD_VERSION && metaMatch[1] !== BUILD_VERSION) {
        mismatchCount.current += 1;
        setUpdateAvailable(true);
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
