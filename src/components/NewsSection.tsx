import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Music, ExternalLink, Disc3, Newspaper } from "lucide-react";

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year: number;
  thumb: string;
  format: string[];
  label: string[];
  genre: string[];
  uri: string;
}

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url?: string;
  category: string;
}

type NewsSource = 'discogs' | 'perplexity';

export const NewsSection = () => {
  const [newsSource, setNewsSource] = useState<NewsSource>('discogs');
  const [discogsReleases, setDiscogsReleases] = useState<DiscogsRelease[]>([]);
  const [musicNews, setMusicNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscogsNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('latest-discogs-news');
      
      if (error) throw error;
      
      if (data.success) {
        setDiscogsReleases(data.releases);
      } else {
        throw new Error(data.error || 'Failed to fetch Discogs releases');
      }
    } catch (err) {
      console.error('Error fetching Discogs news:', err);
      setError('Kon geen nieuwe releases ophalen');
    } finally {
      setLoading(false);
    }
  };

  const fetchMusicNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('music-news-perplexity');
      
      if (error) throw error;
      
      if (data.success) {
        setMusicNews(data.news);
      } else {
        throw new Error(data.error || 'Failed to fetch music news');
      }
    } catch (err) {
      console.error('Error fetching music news:', err);
      setError('Kon geen muzieknieuws ophalen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newsSource === 'discogs') {
      fetchDiscogsNews();
    } else {
      fetchMusicNews();
    }
  }, [newsSource]);

  const handleSourceSwitch = (source: NewsSource) => {
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
            <p className="text-destructive mb-4">{error}</p>
            <Button 
              onClick={() => newsSource === 'discogs' ? fetchDiscogsNews() : fetchMusicNews()}
              variant="outline"
            >
              Opnieuw proberen
            </Button>
          </div>
        )}

        {!loading && !error && newsSource === 'discogs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discogsReleases.map((release) => (
              <Card key={release.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-1">{release.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{release.artist} • {release.year}</p>
                </CardHeader>
                <CardContent>
                  {release.thumb && (
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={release.thumb} 
                        alt={`${release.title} cover`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {release.format.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Format: {release.format.join(', ')}
                      </p>
                    )}
                    {release.genre.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Genre: {release.genre.slice(0, 2).join(', ')}
                      </p>
                    )}
                    <a 
                      href={`https://www.discogs.com${release.uri}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                    >
                      Bekijk op Discogs <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && newsSource === 'perplexity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {musicNews.map((item, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {item.source} • {new Date(item.publishedAt).toLocaleDateString('nl-NL')}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {item.category}
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