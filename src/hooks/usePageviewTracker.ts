import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  const key = 'pageview_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

/**
 * Hook that tracks pageviews internally (parallel to GA4)
 * Stores pageviews in Supabase for admin analytics dashboard
 */
export const usePageviewTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Prevent duplicate tracking for same path
    if (currentPath === lastTrackedPath.current) {
      return;
    }
    
    lastTrackedPath.current = currentPath;

    const trackPageview = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('pageviews').insert({
          path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          user_id: user?.id || null,
        });
      } catch (error) {
        // Silently fail - don't impact user experience
        console.debug('Pageview tracking failed:', error);
      }
    };

    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(trackPageview, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
};
