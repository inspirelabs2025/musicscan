import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  priority?: boolean;
  onLoadComplete?: () => void;
}

/**
 * Optimized image component with:
 * - Lazy loading by default (eager for priority images)
 * - Blur-up placeholder effect
 * - Error fallback handling
 * - Intersection Observer for visibility detection
 */
export const OptimizedImage = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  aspectRatio = 'auto',
  priority = false,
  className,
  onLoadComplete,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  const imageSrc = hasError ? fallback : src;
  const shouldLoad = isInView || priority;

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClass,
        className
      )}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            setIsLoaded(true);
            onLoadComplete?.();
          }}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
