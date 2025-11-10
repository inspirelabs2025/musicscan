import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Send a page view event to Google Analytics
 */
export const sendPageView = (path: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) {
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Send a custom event to Google Analytics
 */
export const sendGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, eventParams);
};

/**
 * Hook that automatically tracks page views on route changes
 */
export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    sendPageView(location.pathname + location.search);
  }, [location]);

  return { sendPageView, sendGAEvent };
};
