import { useEffect, useCallback } from 'react';

/**
 * Preload critical images for better LCP
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload multiple images in parallel
 */
export const preloadImages = async (sources: string[]): Promise<void> => {
  await Promise.allSettled(sources.map(preloadImage));
};

/**
 * Hook to preload images on component mount
 */
export const useImagePreloader = (imageSources: string[]) => {
  useEffect(() => {
    if (imageSources.length === 0) return;
    
    // Use requestIdleCallback for non-critical preloading
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => {
        preloadImages(imageSources);
      });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const timeout = setTimeout(() => {
        preloadImages(imageSources);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [imageSources]);
};

/**
 * Hook to preload image on hover (for better UX)
 */
export const useHoverPreload = () => {
  const preloadOnHover = useCallback((src: string) => {
    return {
      onMouseEnter: () => preloadImage(src),
      onFocus: () => preloadImage(src),
    };
  }, []);

  return { preloadOnHover };
};

/**
 * Utility to check if image is already cached
 */
export const isImageCached = (src: string): boolean => {
  const img = new Image();
  img.src = src;
  return img.complete;
};
