import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CollectionItemSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/30 to-background/50">
        <Skeleton className="w-full h-full" />
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </Card>
  );
};

export const CollectionGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <CollectionItemSkeleton key={index} />
      ))}
    </div>
  );
};

export const AlbumDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <div className="p-6">
                <Skeleton className="aspect-square w-full max-w-md mx-auto mb-4" />
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="w-16 h-16" />
                  ))}
                </div>
              </div>
            </Card>
            
            {/* Album Info */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-18" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScanResultSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-24 h-24 rounded-lg" />
        
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
};

export const SearchResultsSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ScanResultSkeleton key={index} />
      ))}
    </div>
  );
};