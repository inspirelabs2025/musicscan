import { supabase } from '@/integrations/supabase/client';

interface TrackingData {
  ip?: string;
  city?: string;
  country?: string;
  region?: string;
}

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Cache for geo data to avoid repeated API calls
let geoDataCache: TrackingData | null = null;
let geoFetchPromise: Promise<TrackingData> | null = null;

// Session tracking
let sessionStartTime: number | null = null;
let pageStartTime: number | null = null;
let previousPath: string | null = null;
let maxScrollDepth = 0;
let pageviewCount = 0;

// Visitor ID (persistent across sessions)
const VISITOR_ID_KEY = 'musicscan_visitor_id';
const VISITOR_FIRST_SEEN_KEY = 'musicscan_first_seen';

/**
 * Get or create a persistent visitor ID
 */
function getVisitorId(): { visitorId: string; isNew: boolean } {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  let isNew = false;
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    localStorage.setItem(VISITOR_FIRST_SEEN_KEY, new Date().toISOString());
    isNew = true;
  }
  
  return { visitorId, isNew };
}

/**
 * Extract UTM parameters from URL
 */
function getUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  };
}

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
 * Track scroll depth
 */
function trackScrollDepth() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );
  const winHeight = window.innerHeight;
  const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
  
  if (scrollPercent > maxScrollDepth) {
    maxScrollDepth = Math.min(scrollPercent, 100);
  }
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
  
  // Calculate time on previous page
  let timeOnPage: number | undefined;
  if (pageStartTime && previousPath) {
    timeOnPage = Math.round((now - pageStartTime) / 1000);
  }
  
  // Track previous path for exit page analysis
  const prevPath = previousPath;
  previousPath = currentPath;
  
  // Reset scroll depth for new page
  const scrollDepth = maxScrollDepth;
  maxScrollDepth = 0;
  
  lastTrackedPath = currentPath;
  lastTrackedTime = now;
  pageStartTime = now;
  pageviewCount++;
  
  // Initialize session start if first pageview
  if (!sessionStartTime) {
    sessionStartTime = now;
  }
  
  try {
    const geoData = await fetchGeoData();
    const sessionId = getSessionId();
    const { visitorId, isNew } = getVisitorId();
    const utmParams = getUTMParams();
    
    // Determine if this might be a bounce (will be updated server-side)
    // First pageview in session is potentially a bounce until more pages are viewed
    const isBounce = pageviewCount === 1;
    
    const payload = {
      ip: geoData.ip,
      city: geoData.city,
      country: geoData.country,
      region: geoData.region,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      path: currentPath,
      sessionId,
      // New fields
      visitorId,
      isNewVisitor: isNew,
      sessionStartAt: new Date(sessionStartTime).toISOString(),
      scrollDepth: scrollDepth > 0 ? scrollDepth : undefined,
      timeOnPage: timeOnPage,
      previousPath: prevPath,
      isBounce,
      pageLoadTime: Math.round(performance.now()),
      // UTM params
      ...utmParams,
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
 * Send exit page data when leaving
 */
function sendExitData() {
  if (!previousPath || !pageStartTime) return;
  
  const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
  const scrollDepth = maxScrollDepth;
  const sessionId = getSessionId();
  
  // Use sendBeacon for reliable delivery on page exit
  const data = JSON.stringify({
    sessionId,
    path: previousPath,
    timeOnPage,
    scrollDepth,
    exitPage: true,
  });
  
  // Try sendBeacon first, fall back to sync XHR
  const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://ssxbpyqnjfiyubsuonar.supabase.co'}/functions/v1/log-clean-analytics-exit`;
  navigator.sendBeacon(url, data);
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
  
  // Initialize timing
  sessionStartTime = Date.now();
  pageStartTime = Date.now();
  
  // Track initial pageview
  trackCleanPageview();
  
  // Track scroll depth with throttle
  let scrollTimeout: number | null = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = window.setTimeout(() => {
      trackScrollDepth();
      scrollTimeout = null;
    }, 200);
  }, { passive: true });
  
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
  
  // Track page visibility changes (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendExitData();
    }
  });
  
  // Track page unload
  window.addEventListener('beforeunload', sendExitData);
}
