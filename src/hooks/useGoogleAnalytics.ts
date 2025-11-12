import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Check if Google Analytics is ready (loaded via HTML script tag)
 */
const initializeGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('⚠️ GA Measurement ID not found');
    return;
  }
  
  if (!window.gtag) {
    console.warn('⚠️ Google Analytics script not loaded');
    return;
  }
  
  console.log('✅ Google Analytics ready:', GA_MEASUREMENT_ID);
};

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
  
  console.log('📊 GA Page View:', path);
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

  // Initialize GA on mount
  useEffect(() => {
    initializeGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    // Wait for gtag to be available (in case script is still loading)
    const sendPageViewWhenReady = () => {
      if (window.gtag) {
        sendPageView(location.pathname + location.search);
      } else {
        // Retry after 100ms if gtag not ready yet
        setTimeout(sendPageViewWhenReady, 100);
      }
    };
    
    sendPageViewWhenReady();
  }, [location]);

  return { sendPageView, sendGAEvent };
};
