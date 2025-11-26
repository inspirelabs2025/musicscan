import { useSpotifyNewReleases } from '@/hooks/useSpotifyNewReleases';
import { Skeleton } from '@/components/ui/skeleton';
import { Music2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export const SpotifyNewReleasesSection = () => {
  const {
    data: releases,
    isLoading
  } = useSpotifyNewReleases();

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-72 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!releases || releases.length === 0) {
    return null;
  }

  // Show only first 6 releases
  const featuredReleases = releases.slice(0, 6);

  return (
    <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Music2 className="w-10 h-10 text-green-500" />
            Nieuwe releases
          </h2>
          <p className="text-xl text-muted-foreground">Verse album releases</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {featuredReleases.map((release) => (
            <a
              key={release.id}
              href={release.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block space-y-3 transition-transform hover:scale-105"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-shadow">
                {release.image_url ? (
                  <img
                    src={release.image_url}
                    alt={`${release.name} by ${release.artist}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {release.artist}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {release.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(release.release_date), 'd MMM yyyy', {
                    locale: nl
                  })}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
