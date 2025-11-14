import { Link } from 'react-router-dom';
import { Headphones, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFeaturedEpisodes } from '@/hooks/useCuratedPodcasts';
import { Skeleton } from '@/components/ui/skeleton';

export const PodcastSpotlight = () => {
  const { data: featuredEpisodes, isLoading } = useFeaturedEpisodes();

  const displayEpisodes = featuredEpisodes?.slice(0, 3) || [];

  return (
    <section className="py-16 bg-gradient-to-br from-green-500/5 via-background to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full mb-4">
              <Headphones className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Luister & Leer</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              🎧 Muziek Podcasts
            </h2>
            <p className="text-xl text-muted-foreground">
              Ontdek de beste podcasts over vinyl, muziekgeschiedenis en meer
            </p>
          </div>

          {/* Featured Episodes Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="w-full aspect-square rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))
            ) : displayEpisodes.length > 0 ? (
              displayEpisodes.map((episode) => {
                const showImage = (episode as any).spotify_curated_shows?.image_url;
                const episodeName = episode.name;
                const showName = (episode as any).spotify_curated_shows?.name;
                
                return (
                  <Card key={episode.id} className="p-4 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-green-500">
                    <div className="relative mb-4">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-green-500/20 to-primary/20">
                        {showImage ? (
                          <img 
                            src={showImage} 
                            alt={episodeName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Headphones className="w-16 h-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                          <Play className="w-8 h-8 text-green-600 fill-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {episodeName}
                    </h3>
                    
                    {showName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {showName}
                      </p>
                    )}
                    
                    {episode.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {episode.description}
                      </p>
                    )}
                    
                    {episode.duration_ms && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <span>{Math.floor(episode.duration_ms / 60000)} min</span>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              // Placeholder cards
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-4 border-2 border-dashed border-border">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-green-500/10 to-primary/10 flex items-center justify-center mb-4">
                    <Headphones className="w-16 h-16 text-muted-foreground opacity-50" />
                  </div>
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </Card>
              ))
            )}
          </div>

          {/* Features Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Headphones className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Gecureerde Content</h3>
              <p className="text-sm text-muted-foreground">
                Handgekozen podcasts over muziek en vinyl
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Direct Luisteren</h3>
              <p className="text-sm text-muted-foreground">
                Stream episodes rechtstreeks in je browser
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <ArrowRight className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Ontdek Meer</h3>
              <p className="text-sm text-muted-foreground">
                Nieuwe episodes en shows elke week
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              asChild 
              size="lg" 
              className="text-lg bg-gradient-to-r from-green-600 to-green-500 hover:shadow-lg hover:scale-105 transition-all"
            >
              <Link to="/podcasts">
                <Headphones className="w-5 h-5 mr-2" />
                Bekijk Alle Podcasts
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
