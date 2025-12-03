import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivePopups, SitePopup, useIncrementPopupStat } from '@/hooks/useSitePopups';
import { SitePopupDialog } from './SitePopup';

interface PopupContextType {
  showPopup: (popup: SitePopup) => void;
  hidePopup: () => void;
  currentPopup: SitePopup | null;
  markPopupShown: (popupId: string) => void;
  hasBeenShown: (popupId: string) => boolean;
}

const PopupContext = createContext<PopupContextType | null>(null);

export function usePopupContext() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopupContext must be used within SitePopupProvider');
  }
  return context;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export function SitePopupProvider({ children }: { children: ReactNode }) {
  const { data: popups = [] } = useActivePopups();
  const location = useLocation();
  const [currentPopup, setCurrentPopup] = useState<SitePopup | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const incrementStat = useIncrementPopupStat();
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const triggeredRef = useRef<Set<string>>(new Set());

  const markPopupShown = useCallback((popupId: string) => {
    const key = `popup_${popupId}_shown`;
    localStorage.setItem(key, new Date().toISOString());
    sessionStorage.setItem(key, 'true');
    
    const countKey = `popup_${popupId}_count`;
    const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10);
    localStorage.setItem(countKey, (currentCount + 1).toString());
  }, []);

  const hasBeenShown = useCallback((popupId: string): boolean => {
    const popup = popups.find(p => p.id === popupId);
    if (!popup) return true;

    const storageKey = `popup_${popupId}_shown`;
    const dismissedKey = `popup_dismissed_${popupId}`;
    
    if (localStorage.getItem(dismissedKey)) return true;

    const lastShown = localStorage.getItem(storageKey);
    
    switch (popup.display_frequency) {
      case 'once_ever':
        return !!lastShown;
      case 'once_per_day':
        return lastShown ? isToday(new Date(lastShown)) : false;
      case 'once_per_session':
        return !!sessionStorage.getItem(storageKey);
      case 'always':
        return false;
      default:
        return false;
    }
  }, [popups]);

  const showPopup = useCallback((popup: SitePopup) => {
    setCurrentPopup(popup);
    setIsOpen(true);
    markPopupShown(popup.id);
    incrementStat.mutate({ id: popup.id, stat: 'views_count' });
  }, [markPopupShown, incrementStat]);

  const hidePopup = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setCurrentPopup(null), 300);
  }, []);

  const handleClick = useCallback(() => {
    if (currentPopup) {
      incrementStat.mutate({ id: currentPopup.id, stat: 'clicks_count' });
    }
  }, [currentPopup, incrementStat]);

  const handleDismiss = useCallback(() => {
    if (currentPopup) {
      incrementStat.mutate({ id: currentPopup.id, stat: 'dismissals_count' });
    }
    hidePopup();
  }, [currentPopup, incrementStat, hidePopup]);

  // Check if popup should show on current page
  const shouldShowOnPage = useCallback((popup: SitePopup, currentPath: string): boolean => {
    if (popup.exclude_pages?.some(page => currentPath.startsWith(page))) {
      return false;
    }
    if (popup.trigger_pages && popup.trigger_pages.length > 0) {
      return popup.trigger_pages.some(page => currentPath.startsWith(page));
    }
    return true;
  }, []);

  const shouldTriggerPopup = useCallback((popup: SitePopup): boolean => {
    if (triggeredRef.current.has(popup.id)) return false;
    if (hasBeenShown(popup.id)) return false;

    const now = new Date();
    if (popup.start_date && new Date(popup.start_date) > now) return false;
    if (popup.end_date && new Date(popup.end_date) < now) return false;

    if (!shouldShowOnPage(popup, location.pathname)) return false;

    return true;
  }, [hasBeenShown, shouldShowOnPage, location.pathname]);

  const triggerPopup = useCallback((popup: SitePopup) => {
    if (!shouldTriggerPopup(popup)) return;
    
    triggeredRef.current.add(popup.id);
    showPopup(popup);
  }, [shouldTriggerPopup, showPopup]);

  // Reset triggers on route change
  useEffect(() => {
    triggeredRef.current.clear();
  }, [location.pathname]);

  // Setup time-based triggers
  useEffect(() => {
    const timePopups = popups.filter(p => 
      p.trigger_type === 'time_on_page' && 
      !triggeredRef.current.has(p.id) &&
      !hasBeenShown(p.id) &&
      shouldShowOnPage(p, location.pathname)
    );
    
    timePopups.forEach(popup => {
      const delay = (popup.trigger_value || 30) * 1000;
      const timeout = setTimeout(() => {
        triggerPopup(popup);
      }, delay);
      timeoutRefs.current.set(popup.id, timeout);
    });

    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, [popups, location.pathname, hasBeenShown, shouldShowOnPage, triggerPopup]);

  // Setup scroll-based triggers
  useEffect(() => {
    const scrollPopups = popups.filter(p => 
      p.trigger_type === 'scroll_depth' && 
      !triggeredRef.current.has(p.id) &&
      !hasBeenShown(p.id) &&
      shouldShowOnPage(p, location.pathname)
    );
    
    if (scrollPopups.length === 0) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      scrollPopups.forEach(popup => {
        const threshold = popup.trigger_value || 50;
        if (scrollPercent >= threshold && !triggeredRef.current.has(popup.id)) {
          triggerPopup(popup);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [popups, location.pathname, hasBeenShown, shouldShowOnPage, triggerPopup]);

  // Setup exit intent triggers (desktop only)
  useEffect(() => {
    const exitPopups = popups.filter(p => 
      p.trigger_type === 'exit_intent' && 
      !triggeredRef.current.has(p.id) &&
      !hasBeenShown(p.id) &&
      shouldShowOnPage(p, location.pathname)
    );
    
    if (exitPopups.length === 0) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        const popup = exitPopups[0];
        if (popup && !triggeredRef.current.has(popup.id)) {
          triggerPopup(popup);
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [popups, location.pathname, hasBeenShown, shouldShowOnPage, triggerPopup]);

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup, currentPopup, markPopupShown, hasBeenShown }}>
      {children}
      <SitePopupDialog 
        popup={currentPopup} 
        isOpen={isOpen} 
        onClose={handleDismiss}
        onButtonClick={handleClick}
      />
    </PopupContext.Provider>
  );
}
