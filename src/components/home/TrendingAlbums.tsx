import { useTrendingAlbums } from '@/hooks/useTrendingAlbums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Disc } from 'lucide-react';

export const TrendingAlbums = () => {
  const { data: albums, isLoading } = useTrendingAlbums();

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trending Albums Deze Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : albums && albums.length > 0 ? (
            albums.map((album, index) => (
              <div
                key={album.id}
                className="group relative space-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                  {album.cover_image ? (
                    <img
                      src={album.cover_image}
                      alt={`${album.artist} - ${album.title}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  {album.scan_count > 1 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="text-xs gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {album.scan_count}x
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                    {album.artist}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {album.title}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-muted-foreground">
                Nog geen trending albums deze week
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
