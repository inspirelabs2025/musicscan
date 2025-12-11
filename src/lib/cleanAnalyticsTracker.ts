import { supabase } from '@/integrations/supabase/client';

interface TrackingData {
  ip?: string;
  city?: string;
  country?: string;
  region?: string;
}

// Cache for geo data to avoid repeated API calls
let geoDataCache: TrackingData | null = null;
let geoFetchPromise: Promise<TrackingData> | null = null;

/**
 * Fetch geo data from multiple IP geolocation services with fallback
 */
async function fetchGeoData(): Promise<TrackingData> {
  if (geoDataCache) return geoDataCache;
  if (geoFetchPromise) return geoFetchPromise;
  
  geoFetchPromise = (async () => {
    // Try ipapi.co first (most reliable)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(4000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country_name) {
          geoDataCache = {
            ip: data.ip,
            city: data.city,
            country: data.country_name,
            region: data.region,
          };
          return geoDataCache;
        }
      }
    } catch (error) {
      console.log('[clean-analytics] ipapi.co failed, trying fallback');
    }
    
    // Fallback to ip-api.com
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,city,country,regionName,query', {
        signal: AbortSignal.timeout(4000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          geoDataCache = {
            ip: data.query,
            city: data.city,
            country: data.country,
            region: data.regionName,
          };
          return geoDataCache;
        }
      }
    } catch (error) {
      console.log('[clean-analytics] ip-api.com failed, trying final fallback');
    }
    
    // Final fallback to ipinfo.io (limited free tier)
    try {
      const response = await fetch('https://ipinfo.io/json', {
        signal: AbortSignal.timeout(4000)
      });
      
      if (response.ok) {
        const data = await response.json();
        geoDataCache = {
          ip: data.ip,
          city: data.city,
          country: data.country,
          region: data.region,
        };
        return geoDataCache;
      }
    } catch (error) {
      console.log('[clean-analytics] All geo lookups failed');
    }
    
    return {};
  })();
  
  return geoFetchPromise;
}

/**
 * Generate or retrieve session ID
 */
function getSessionId(): string {
  const key = 'musicscan_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/**
 * Debounce tracking to avoid duplicate calls
 */
let lastTrackedPath = '';
let lastTrackedTime = 0;
const DEBOUNCE_MS = 2000;

/**
 * Track a pageview to clean_analytics
 */
export async function trackCleanPageview(path?: string): Promise<void> {
  const currentPath = path || window.location.pathname;
  const now = Date.now();
  
  // Debounce: don't track same path within 2 seconds
  if (currentPath === lastTrackedPath && now - lastTrackedTime < DEBOUNCE_MS) {
    return;
  }
  
  lastTrackedPath = currentPath;
  lastTrackedTime = now;
  
  try {
    const geoData = await fetchGeoData();
    const sessionId = getSessionId();
    
    const payload = {
      ip: geoData.ip,
      city: geoData.city,
      country: geoData.country,
      region: geoData.region,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      path: currentPath,
      sessionId,
    };

    // Call the edge function (fire and forget for performance)
    supabase.functions.invoke('log-clean-analytics', {
      body: payload,
    }).catch(error => {
      console.error('[clean-analytics] Tracking error:', error);
    });
  } catch (error) {
    console.error('[clean-analytics] Tracking failed:', error);
  }
}

/**
 * Initialize clean analytics tracking
 * Call this once on app startup
 */
export function initCleanAnalytics(): void {
  // Don't track in development/localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[clean-analytics] Skipping tracking on localhost');
    return;
  }
  
  // Track initial pageview
  trackCleanPageview();
  
  // Track navigation changes for SPA using History API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    trackCleanPageview();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    trackCleanPageview();
  };
  
  // Track popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    trackCleanPageview();
  });
}
