import { supabase } from '@/integrations/supabase/client';

interface TrackingData {
  city?: string;
  country?: string;
  region?: string;
}

// Cache for geo data to avoid repeated API calls
let geoDataCache: TrackingData | null = null;

/**
 * Fetch geo data from a free IP geolocation service
 */
async function fetchGeoData(): Promise<TrackingData> {
  if (geoDataCache) return geoDataCache;
  
  try {
    // Use ipapi.co for free geo lookup
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      geoDataCache = {
        city: data.city,
        country: data.country_name,
        region: data.region,
      };
      return geoDataCache;
    }
  } catch (error) {
    console.log('[clean-analytics] Geo lookup failed:', error);
  }
  
  return {};
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
 * Track a pageview to clean_analytics
 */
export async function trackCleanPageview(path?: string): Promise<void> {
  try {
    const geoData = await fetchGeoData();
    const sessionId = getSessionId();
    
    const payload = {
      city: geoData.city,
      country: geoData.country,
      region: geoData.region,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      path: path || window.location.pathname,
      sessionId,
    };

    // Call the edge function
    const { error } = await supabase.functions.invoke('log-clean-analytics', {
      body: payload,
    });

    if (error) {
      console.error('[clean-analytics] Tracking error:', error);
    }
  } catch (error) {
    console.error('[clean-analytics] Tracking failed:', error);
  }
}

/**
 * Initialize clean analytics tracking
 * Call this once on app startup
 */
export function initCleanAnalytics(): void {
  // Track initial pageview
  trackCleanPageview();
  
  // Track navigation changes for SPA
  let lastPath = window.location.pathname;
  
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackCleanPageview(lastPath);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
