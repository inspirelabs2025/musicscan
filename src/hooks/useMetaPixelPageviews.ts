import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fires Meta Pixel PageView on every SPA route change.
 * Base PageView on first load is fired by the pixel snippet in index.html.
 */
export const useMetaPixelPageviews = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fbq = (window as any).fbq;
    if (typeof fbq !== 'function') return;
    fbq('track', 'PageView');
  }, [location.pathname, location.search]);
};
