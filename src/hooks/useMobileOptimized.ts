import { useState, useEffect, useCallback } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  platform: 'ios' | 'android' | 'other';
}

export const useMobileOptimized = (): MobileDetectionResult => {
  const [mobileState, setMobileState] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg',
    orientation: 'landscape',
    platform: 'other'
  });

  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Platform detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    // Device type detection
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Screen size classification
    let screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg';
    if (width < 640) screenSize = 'sm';
    else if (width < 768) screenSize = 'md';
    else if (width < 1024) screenSize = 'lg';
    else if (width < 1280) screenSize = 'xl';
    else screenSize = '2xl';
    
    // Orientation
    const orientation = height > width ? 'portrait' : 'landscape';
    
    // Platform
    let platform: 'ios' | 'android' | 'other' = 'other';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';
    
    setMobileState({
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize,
      orientation,
      platform
    });
  }, []);

  useEffect(() => {
    detectDevice();
    
    const handleResize = () => detectDevice();
    const handleOrientationChange = () => {
      // Delay to ensure proper dimensions
      setTimeout(detectDevice, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [detectDevice]);

  return mobileState;
};

// Touch gesture hooks
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;
    
    // Determine primary direction
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) onSwipeUp();
      if (isDownSwipe && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

// Pull to refresh hook
export const usePullToRefresh = (onRefresh: () => Promise<void> | void, threshold: number = 80) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { isMobile } = useMobileOptimized();

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && isMobile) {
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const touch = e.touches[0];
    const distance = Math.max(0, touch.clientY - 60); // Offset for header
    setPullDistance(Math.min(distance, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
};

// Improved file upload for mobile
export const useMobileFileUpload = () => {
  const { isMobile, platform } = useMobileOptimized();
  
  const optimizedAccept = isMobile 
    ? 'image/*'  // Mobile devices handle this better
    : 'image/jpeg,image/jpg,image/png,image/webp';
    
  const recommendedSettings = {
    accept: optimizedAccept,
    multiple: true,
    capture: platform === 'ios' || platform === 'android' ? 'environment' as const : undefined,
    // Mobile-specific optimizations
    ...(isMobile && {
      style: {
        fontSize: '16px', // Prevents zoom on iOS
        touchAction: 'manipulation'
      }
    })
  };
  
  return {
    isMobile,
    platform,
    recommendedSettings,
    // Helper for better mobile camera access
    openCamera: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.click();
      return input;
    }
  };
};