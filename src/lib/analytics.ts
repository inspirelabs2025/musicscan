interface EventParams {
  [key: string]: any;
}

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config',
      eventName: string,
      params?: EventParams
    ) => void;
  }
}

export const trackEvent = (eventName: string, params?: EventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  } else {
    // console.warn('Google Analytics (gtag) is not loaded.');
  }
};

export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: path,
    });
  } else {
    // console.warn('Google Analytics (gtag) is not loaded.');
  }
};
