import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics by loading the script dynamically
 */
const initializeGA = () => {
  if (!GA_MEASUREMENT_ID || window.gtag) {
    return; // Already initialized or no ID
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag as any;
  
  // Configure GA
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { 
    send_page_view: false // We handle this manually
  });

  console.log('📊 Google Analytics initialized:', GA_MEASUREMENT_ID);
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

    sendPageView(location.pathname + location.search);
  }, [location]);

  return { sendPageView, sendGAEvent };
};
