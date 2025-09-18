import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, ExternalLink, Disc3, Newspaper } from "lucide-react";
import { useDiscogsNews, usePerplexityNews } from "@/hooks/useNewsCache";

export const NewsSection = () => {
  const [newsSource, setNewsSource] = useState<'discogs' | 'perplexity'>('discogs');

  // Use the new cached hooks
  const { data: discogsReleases = [], isLoading: isLoadingDiscogs, error: discogsError } = useDiscogsNews();
  const { data: musicNews = [], isLoading: isLoadingPerplexity, error: perplexityError } = usePerplexityNews();

  const loading = newsSource === 'discogs' ? isLoadingDiscogs : isLoadingPerplexity;
  const error = newsSource === 'discogs' ? discogsError : perplexityError;

  const handleSourceSwitch = (source: 'discogs' | 'perplexity') => {
    if (source !== newsSource) {
      setNewsSource(source);
    }
  };
  
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Laatste Muzieknieuws
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Blijf op de hoogte van de nieuwste releases en muzieknieuws
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              variant={newsSource === 'discogs' ? 'default' : 'outline'} 
              onClick={() => handleSourceSwitch('discogs')} 
              className="flex items-center gap-2"
            >
              <Disc3 className="w-4 h-4" />
              Nieuwe Releases
            </Button>
            <Button 
              variant={newsSource === 'perplexity' ? 'default' : 'outline'} 
              onClick={() => handleSourceSwitch('perplexity')} 
              className="flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              Muzieknieuws
            </Button>
          </div>
        </div>

        {loading && <LoadingSkeleton />}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              {typeof error === 'string' ? error : 'Er is een fout opgetreden bij het ophalen van de gegevens.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {!loading && !error && newsSource === 'discogs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(discogsReleases as any[]).map((release: any) => (
              <Card key={release.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-1">{release.title || 'Onbekende titel'}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {release.artist || 'Onbekende artiest'} • {release.year || 'Jaar onbekend'}
                  </p>
                </CardHeader>
                <CardContent>
                  {(release.stored_image || release.thumb || release.artwork) && (
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={release.stored_image || release.thumb || release.artwork} 
                        alt={`${release.title} cover`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to original thumb if stored image fails
                          if (release.stored_image && e.currentTarget.src === release.stored_image) {
                            e.currentTarget.src = release.thumb || release.artwork || '';
                          }
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {release.format && Array.isArray(release.format) && release.format.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Format: {release.format.join(', ')}
                      </p>
                    )}
                    {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Genre: {release.genre.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && newsSource === 'perplexity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(musicNews as any[]).map((item: any, index: number) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{item.title || 'Onbekende titel'}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {item.source || 'Onbekende bron'} • {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('nl-NL') : 'Datum onbekend'}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3">{item.summary || 'Geen samenvatting beschikbaar'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {item.category || 'Algemeen'}
                    </span>
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                      >
                        Lees meer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};