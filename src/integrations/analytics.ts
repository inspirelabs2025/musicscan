declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  } else {
    console.warn(`Analytics not initialized. Event '${eventName}' not tracked.`, params);
  }
};
