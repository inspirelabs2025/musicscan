import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Fires a manual GA4 page_view event on every route change.
 * Required because index.html sets send_page_view: false.
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Small delay to let document.title update after navigation
    const timeout = setTimeout(() => {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: location.pathname + location.search,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.search]);
};
