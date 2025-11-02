import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export const LatestReleasesSection = () => {
  const { data: releases, isLoading } = useQuery({
    queryKey: ['latest-releases'],
    queryFn: async () => {
      // Get latest albums from unified_scans
      const { data, error } = await supabase
        .from('unified_scans')
        .select('*')
        .not('cover_image', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!releases || releases.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <Music className="inline-block w-10 h-10 mr-3 text-vinyl-gold" />
            Nieuwste Releases
          </h2>
          <p className="text-xl text-muted-foreground">
            Recentelijk toegevoegde albums aan onze database
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {releases.map((release) => (
            <Link 
              key={release.id} 
              to={`/album/${release.id}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all hover:scale-105 h-full border-2 hover:border-vinyl-gold">
                {/* Album Cover */}
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20">
                  {release.cover_image ? (
                    <img 
                      src={release.cover_image} 
                      alt={release.album || 'Album'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🎵
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(release.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {release.artist || 'Onbekend'}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {release.album || 'Album'}
                  </p>

                  {release.media_type && (
                    <Badge variant="secondary" className="text-xs">
                      {release.media_type.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link 
            to="/public-catalog"
            className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
          >
            Bekijk Alle Releases →
          </Link>
        </div>
      </div>
    </section>
  );
};
