import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Music } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const LatestReleasesSection = () => {
  const isMobile = useIsMobile();
  const { data: releases, isLoading } = useQuery({
    queryKey: ['latest-releases'],
    queryFn: async () => {
      // Get latest releases from releases table
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .not('artwork_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const renderReleaseCard = (release: any) => (
    <Link 
      key={release.id} 
      to={`/album/${release.id}`}
      className="group block"
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all hover:scale-105 h-full border-2 hover:border-vinyl-gold">
        {/* Album Cover */}
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20">
          {release.artwork_url ? (
            <img 
              src={release.artwork_url} 
              alt={release.title || 'Album'}
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
            {release.title || 'Album'}
          </p>

          {release.format && (
            <Badge variant="secondary" className="text-xs">
              {release.format}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );

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
    <section className={isMobile ? "py-8 bg-muted/30" : "py-16 bg-muted/30"}>
      <div className="container mx-auto px-4">
        <div className={isMobile ? "text-center mb-6" : "text-center mb-12"}>
          <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
            <Music className={isMobile ? "inline-block w-6 h-6 mr-2 text-vinyl-gold" : "inline-block w-10 h-10 mr-3 text-vinyl-gold"} />
            Nieuwste Releases
          </h2>
          {!isMobile && (
            <p className="text-xl text-muted-foreground">
              Recentelijk toegevoegde albums aan onze database
            </p>
          )}
        </div>

        {isMobile ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {releases.map((release) => (
                <CarouselItem key={release.id} className="pl-2 basis-[45%]">{renderReleaseCard(release)}</CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {releases.map((release) => renderReleaseCard(release))}
          </div>
        )}
        
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
