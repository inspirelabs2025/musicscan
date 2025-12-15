/**
 * Performance monitoring utilities for MusicScan
 */

// Track Largest Contentful Paint
export const trackLCP = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('📊 LCP:', lastEntry.startTime.toFixed(0), 'ms');
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
};

// Track First Input Delay
export const trackFID = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('📊 FID:', entry.processingStart - entry.startTime, 'ms');
      });
    });
    observer.observe({ type: 'first-input', buffered: true });
  }
};

// Track Cumulative Layout Shift
export const trackCLS = () => {
  if ('PerformanceObserver' in window) {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📊 CLS:', clsValue.toFixed(3));
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }
};

// Track Time to First Byte
export const trackTTFB = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.responseStart) {
          console.log('📊 TTFB:', entry.responseStart.toFixed(0), 'ms');
        }
      });
    });
    observer.observe({ type: 'navigation', buffered: true });
  }
};

// Initialize all performance tracking (development only)
export const initPerformanceTracking = () => {
  if (import.meta.env.DEV) {
    trackLCP();
    trackFID();
    trackCLS();
    trackTTFB();
  }
};

// Get navigation timing metrics
export const getNavigationMetrics = () => {
  if (!performance.getEntriesByType) return null;
  
  const [navEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (!navEntry) return null;

  return {
    dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
    tcpConnect: navEntry.connectEnd - navEntry.connectStart,
    tlsNegotiation: navEntry.requestStart - navEntry.secureConnectionStart,
    ttfb: navEntry.responseStart - navEntry.requestStart,
    download: navEntry.responseEnd - navEntry.responseStart,
    domParsing: navEntry.domInteractive - navEntry.responseEnd,
    domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
    load: navEntry.loadEventEnd - navEntry.loadEventStart,
    totalTime: navEntry.loadEventEnd - navEntry.startTime,
  };
};

// Report metrics to console in a formatted way
export const reportPerformanceMetrics = () => {
  const metrics = getNavigationMetrics();
  if (!metrics) return;

  console.group('📊 Performance Metrics');
  console.table({
    'DNS Lookup': `${metrics.dnsLookup.toFixed(0)}ms`,
    'TCP Connect': `${metrics.tcpConnect.toFixed(0)}ms`,
    'TTFB': `${metrics.ttfb.toFixed(0)}ms`,
    'Download': `${metrics.download.toFixed(0)}ms`,
    'DOM Parsing': `${metrics.domParsing.toFixed(0)}ms`,
    'Total Load': `${metrics.totalTime.toFixed(0)}ms`,
  });
  console.groupEnd();
};
