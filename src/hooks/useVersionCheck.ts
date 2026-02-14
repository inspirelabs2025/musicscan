import { useEffect, useCallback } from 'react';

// Injected at build time by Vite — unique per build
declare const __BUILD_TIMESTAMP__: string;
const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '';

export const useVersionCheck = (intervalMs = 2 * 60 * 1000) => {
  const checkVersion = useCallback(async () => {
    if (!BUILD_VERSION) return;
    
    try {
      const resp = await fetch(`/index.html?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!resp.ok) return;
      const html = await resp.text();

      const metaMatch = html.match(/name="build-version"\s+content="([^"]+)"/);
      
      if (metaMatch?.[1] && metaMatch[1] !== BUILD_VERSION) {
        window.location.reload();
      }
    } catch {
      // Network error — ignore
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(checkVersion, 5_000);
    const interval = setInterval(checkVersion, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [checkVersion, intervalMs]);
};
