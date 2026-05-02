interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}

/**
 * Tracks a custom event in Google Analytics (if GA is integrated).
 * Also logs to console for development.
 * @param eventName The name of the event.
 * @param params Optional parameters to associate with the event.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  } else {
    // Fallback for development or when gtag is not available
    console.log(`Analytics Event: ${eventName}`, params);
  }
};

/**
 * Tracks a page view event.
 * @param path The URL path of the page.
 * @param title The title of the page.
 */
export const trackPageView = (path: string, title: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  } else {
    console.log(`Page View: ${title} (${path})`);
  }
};
