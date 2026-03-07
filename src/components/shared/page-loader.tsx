import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton page loader matching the homepage layout for perceived performance.
 * Shows header + card skeletons instead of a spinner.
 */
export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-14 bg-muted/30 border-b border-border/20" />

      {/* Hero skeleton */}
      <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-5 w-96 max-w-full rounded" />
        <Skeleton className="h-12 w-44 rounded-xl mt-4" />
      </div>

      {/* Section skeleton - horizontal cards */}
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-48 mb-4 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 md:w-48">
              <Skeleton className="aspect-square rounded-xl mb-2" />
              <Skeleton className="h-4 w-32 rounded mb-1" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Second section skeleton */}
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-36 mb-4 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 md:w-48">
              <Skeleton className="aspect-square rounded-xl mb-2" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
