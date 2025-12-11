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

interface DeviceInfo {
  screen_resolution: string;
  viewport_width: number;
  viewport_height: number;
  color_depth: number;
  timezone: string;
  language: string;
  platform: string;
  touch_support: boolean;
  connection_type: string | null;
  device_memory: number | null;
  cpu_cores: number | null;
  ad_blocker_detected: boolean;
  do_not_track: boolean;
  cookies_enabled: boolean;
  java_enabled: boolean;
  online_status: boolean;
  webgl_vendor: string | null;
  webgl_renderer: string | null;
}

interface PerformanceTiming {
  dns_time: number | null;
  connect_time: number | null;
  ttfb: number | null;
  dom_interactive: number | null;
  fully_loaded: number | null;
}

interface BatteryInfo {
  battery_level: number | null;
  battery_charging: boolean | null;
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

// Interaction tracking
let clickCount = 0;
let copyEvents = 0;
let printAttempts = 0;
let downloadClicks = 0;

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
 * Get comprehensive device/browser info
 */
function getDeviceInfo(): DeviceInfo {
  const nav = navigator as any;
  
  // Screen info
  const screenResolution = `${screen.width}x${screen.height}`;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const colorDepth = screen.colorDepth;
  
  // System info
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform || nav.userAgentData?.platform || 'Unknown';
  
  // Capabilities
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const deviceMemory = nav.deviceMemory || null;
  const cpuCores = navigator.hardwareConcurrency || null;
  
  // Connection info
  let connectionType = null;
  if (nav.connection) {
    connectionType = nav.connection.effectiveType || nav.connection.type || null;
  }
  
  // Privacy settings
  const doNotTrack = navigator.doNotTrack === '1' || (nav.globalPrivacyControl === true);
  const cookiesEnabled = navigator.cookieEnabled;
  const javaEnabled = false;
  const onlineStatus = navigator.onLine;
  
  // Ad blocker detection
  let adBlockerDetected = false;
  try {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-banner';
    testAd.style.cssText = 'position:absolute;left:-9999px;';
    document.body.appendChild(testAd);
    adBlockerDetected = testAd.offsetHeight === 0;
    document.body.removeChild(testAd);
  } catch (e) {
    adBlockerDetected = false;
  }
  
  // WebGL info (GPU)
  let webglVendor = null;
  let webglRenderer = null;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // WebGL not available
  }
  
  return {
    screen_resolution: screenResolution,
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    color_depth: colorDepth,
    timezone,
    language,
    platform,
    touch_support: touchSupport,
    connection_type: connectionType,
    device_memory: deviceMemory,
    cpu_cores: cpuCores,
    ad_blocker_detected: adBlockerDetected,
    do_not_track: doNotTrack,
    cookies_enabled: cookiesEnabled,
    java_enabled: javaEnabled,
    online_status: onlineStatus,
    webgl_vendor: webglVendor,
    webgl_renderer: webglRenderer,
  };
}

/**
 * Get battery info (async)
 */
async function getBatteryInfo(): Promise<BatteryInfo> {
  try {
    const nav = navigator as any;
    if (nav.getBattery) {
      const battery = await nav.getBattery();
      return {
        battery_level: Math.round(battery.level * 100),
        battery_charging: battery.charging,
      };
    }
  } catch (e) {
    // Battery API not available
  }
  return { battery_level: null, battery_charging: null };
}

/**
 * Get performance timing
 */
function getPerformanceTiming(): PerformanceTiming {
  try {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      const nav = entries[0];
      return {
        dns_time: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        connect_time: Math.round(nav.connectEnd - nav.connectStart),
        ttfb: Math.round(nav.responseStart - nav.requestStart),
        dom_interactive: Math.round(nav.domInteractive - nav.fetchStart),
        fully_loaded: Math.round(nav.loadEventEnd - nav.fetchStart),
      };
    }
  } catch (e) {
    // Performance API not available
  }
  return {
    dns_time: null,
    connect_time: null,
    ttfb: null,
    dom_interactive: null,
    fully_loaded: null,
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
 * Reset interaction counters for new page
 */
function resetInteractionCounters() {
  clickCount = 0;
  copyEvents = 0;
  printAttempts = 0;
  downloadClicks = 0;
}

/**
 * Get current interaction counts
 */
function getInteractionCounts() {
  return {
    click_count: clickCount,
    copy_events: copyEvents,
    print_attempts: printAttempts,
    download_clicks: downloadClicks,
  };
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
  
  // Get scroll depth and interaction counts before resetting
  const scrollDepth = maxScrollDepth;
  const interactions = getInteractionCounts();
  maxScrollDepth = 0;
  resetInteractionCounters();
  
  lastTrackedPath = currentPath;
  lastTrackedTime = now;
  pageStartTime = now;
  pageviewCount++;
  
  // Initialize session start if first pageview
  if (!sessionStartTime) {
    sessionStartTime = now;
  }
  
  try {
    // Gather all data
    const [geoData, batteryInfo] = await Promise.all([
      fetchGeoData(),
      getBatteryInfo(),
    ]);
    
    const sessionId = getSessionId();
    const { visitorId, isNew } = getVisitorId();
    const utmParams = getUTMParams();
    const deviceInfo = getDeviceInfo();
    const perfTiming = getPerformanceTiming();
    
    // Determine if this might be a bounce
    const isBounce = pageviewCount === 1;
    
    const payload = {
      // Geo data
      ip: geoData.ip,
      city: geoData.city,
      country: geoData.country,
      region: geoData.region,
      
      // Basic tracking
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      path: currentPath,
      sessionId,
      
      // Visitor tracking
      visitorId,
      isNewVisitor: isNew,
      sessionStartAt: new Date(sessionStartTime).toISOString(),
      
      // Engagement
      scrollDepth: scrollDepth > 0 ? scrollDepth : undefined,
      timeOnPage: timeOnPage,
      previousPath: prevPath,
      isBounce,
      pageLoadTime: Math.round(performance.now()),
      
      // Device info
      ...deviceInfo,
      
      // Battery info
      ...batteryInfo,
      
      // Performance timing
      ...perfTiming,
      
      // Interaction counts (from previous page)
      ...interactions,
      
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
  const interactions = getInteractionCounts();
  
  // Use sendBeacon for reliable delivery on page exit
  const data = JSON.stringify({
    sessionId,
    path: previousPath,
    timeOnPage,
    scrollDepth,
    exitPage: true,
    ...interactions,
  });
  
  // Try sendBeacon first, fall back to sync XHR
  const url = 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/log-clean-analytics-exit';
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
  
  // Track clicks
  window.addEventListener('click', (e) => {
    clickCount++;
    
    // Track download clicks
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      const href = link.getAttribute('href') || '';
      const hasDownload = link.hasAttribute('download');
      const isFileLink = /\.(pdf|zip|doc|docx|xls|xlsx|csv|mp3|mp4|wav|rar|7z)$/i.test(href);
      if (hasDownload || isFileLink) {
        downloadClicks++;
      }
    }
  }, { passive: true });
  
  // Track copy events
  document.addEventListener('copy', () => { copyEvents++; });
  
  // Track print attempts
  window.addEventListener('beforeprint', () => { printAttempts++; });
  
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
