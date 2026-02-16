import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Injected at build time by Vite — unique per build
declare const __BUILD_TIMESTAMP__: string;
const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '';

const RELOAD_KEY = 'musicscan_last_reload_version';
const RELOAD_COUNT_KEY = 'musicscan_reload_count';
const MAX_AUTO_RELOADS = 2; // Prevent infinite reload loops

export const useVersionCheck = (intervalMs = 60 * 1000) => {
  const hasShownToast = useRef(false);

  const checkVersion = useCallback(async () => {
    if (!BUILD_VERSION) return;
    
    try {
      const resp = await fetch(`/index.html?_nocache=${Date.now()}`, {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!resp.ok) return;
      const html = await resp.text();

      const metaMatch = html.match(/name="build-version"\s+content="([^"]+)"/);
      const serverVersion = metaMatch?.[1];
      
      if (serverVersion && serverVersion !== BUILD_VERSION) {
        const lastReloadVersion = sessionStorage.getItem(RELOAD_KEY);
        const reloadCount = parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0', 10);
        
        // If we already tried reloading for this version too many times, show toast instead
        if (lastReloadVersion === serverVersion && reloadCount >= MAX_AUTO_RELOADS) {
          if (!hasShownToast.current) {
            hasShownToast.current = true;
            toast.info('🔄 Er is een nieuwe versie beschikbaar!', {
              description: 'Klik om te verversen',
              duration: Infinity,
              action: {
                label: 'Verversen',
                onClick: () => {
                  // Nuclear option: clear everything and force reload
                  sessionStorage.removeItem(RELOAD_KEY);
                  sessionStorage.removeItem(RELOAD_COUNT_KEY);
                  if ('caches' in window) {
                    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
                  }
                  window.location.href = window.location.pathname + '?_v=' + Date.now();
                },
              },
            });
          }
          return;
        }
        
        // Track reload attempts for this version
        if (lastReloadVersion === serverVersion) {
          sessionStorage.setItem(RELOAD_COUNT_KEY, String(reloadCount + 1));
        } else {
          sessionStorage.setItem(RELOAD_KEY, serverVersion);
          sessionStorage.setItem(RELOAD_COUNT_KEY, '1');
        }

        // Clear all caches before reload
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(n => caches.delete(n)));
        }
        
        // Force reload with cache-busting URL
        window.location.href = window.location.pathname + '?_v=' + Date.now();
      } else if (serverVersion === BUILD_VERSION) {
        // Version matches — reset reload tracking
        sessionStorage.removeItem(RELOAD_COUNT_KEY);
      }
    } catch {
      // Network error — ignore
    }
  }, []);

  useEffect(() => {
    // Check almost immediately on mount
    const initial = setTimeout(checkVersion, 2_000);
    const interval = setInterval(checkVersion, intervalMs);
    
    // Also check when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkVersion, intervalMs]);
};

// Export build version for debugging
export const getBuildVersion = () => BUILD_VERSION;
