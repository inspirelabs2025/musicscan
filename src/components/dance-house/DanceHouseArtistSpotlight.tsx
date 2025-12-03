import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useDanceHouseArtiesten } from '@/hooks/useDanceHouseMuziek';
import { Skeleton } from '@/components/ui/skeleton';

export const DanceHouseArtistSpotlight = () => {
  const { data: artists, isLoading } = useDanceHouseArtiesten(1);
  const spotlight = artists?.[0];

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-r from-cyan-950/30 to-purple-950/30">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-background/50 backdrop-blur">
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  // Fallback spotlight als geen artist story beschikbaar
  const defaultSpotlight = {
    artist_name: 'Daft Punk',
    artwork_url: 'https://i.discogs.com/4bPnKYvbZp_QO8xGl7_y9vNiMX0nBGG4U-IQN1qKCBU/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTE3ODkw/LTE2NzIzMTMwNTQt/MjI3NS5qcGVn.jpeg',
    biography: 'Het Franse duo Thomas Bangalter en Guy-Manuel de Homem-Christo revolutioneerde elektronische muziek. Hun debuutalbum Homework (1997) definieerde French House, terwijl Discovery (2001) en Random Access Memories (2013) nieuwe standaarden zetten voor productie en creativiteit.',
    slug: 'daft-punk'
  };

  const artist = spotlight || defaultSpotlight;

  return (
    <section className="py-16 bg-gradient-to-r from-cyan-950/30 to-purple-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 text-sm">Artist Spotlight</span>
          </div>
          <h2 className="text-3xl font-bold">Legendarische Dance Artiest</h2>
        </div>

        <Card className="overflow-hidden bg-background/50 backdrop-blur border-cyan-500/20 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 md:h-auto">
              <img
                src={artist.artwork_url || '/placeholder.svg'}
                alt={artist.artist_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/80 md:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent md:hidden" />
            </div>

            {/* Content */}
            <CardContent className="p-6 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {artist.artist_name}
              </h3>
              <p className="text-muted-foreground mb-6 line-clamp-4">
                {artist.biography || artist.story_content?.substring(0, 300) + '...'}
              </p>
              <div className="flex gap-3">
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500">
                  <Link to={`/artists/${artist.slug}`}>
                    Lees meer
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
};
