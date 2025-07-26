import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Music, ExternalLink, Disc3, Newspaper, Search, Filter, Grid, List, Calendar, Star } from "lucide-react";
import { Navigation } from "@/components/Navigation";

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
type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'title' | 'relevance';

export default function MusicNews() {
  const [newsSource, setNewsSource] = useState<NewsSource>('discogs');
  const [discogsReleases, setDiscogsReleases] = useState<DiscogsRelease[]>([]);
  const [musicNews, setMusicNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced state for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const fetchDiscogsNews = async () => {
    setLoading(true);
    setError(null);
    console.log('Fetching Discogs news...');
    
    try {
      const { data, error } = await supabase.functions.invoke('latest-discogs-news');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Discogs response:', data);
      
      if (data?.success && data?.releases) {
        setDiscogsReleases(data.releases);
        console.log(`Loaded ${data.releases.length} Discogs releases`);
      } else {
        console.warn('No releases returned from Discogs API');
        setDiscogsReleases([]);
      }
    } catch (err) {
      console.error('Error fetching Discogs news:', err);
      setError(`Kon geen nieuwe releases ophalen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMusicNews = async () => {
    setLoading(true);
    setError(null);
    console.log('Fetching music news...');
    
    try {
      const { data, error } = await supabase.functions.invoke('music-news-perplexity');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Music news response:', data);
      
      if (data?.success && data?.news) {
        setMusicNews(data.news);
        console.log(`Loaded ${data.news.length} music news items`);
      } else {
        console.warn('No news returned from Perplexity API');
        setMusicNews([]);
      }
    } catch (err) {
      console.error('Error fetching music news:', err);
      setError(`Kon geen muzieknieuws ophalen: ${err.message}`);
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

  // Filter and sort logic
  const filteredData = () => {
    if (newsSource === 'discogs') {
      let filtered = discogsReleases.filter(release => {
        const matchesSearch = searchQuery === '' || 
          release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          release.artist.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesGenre = selectedGenre === 'all' || 
          release.genre.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
        
        const matchesYear = selectedYear === 'all' || 
          release.year.toString() === selectedYear;
        
        return matchesSearch && matchesGenre && matchesYear;
      });

      // Sort releases
      if (sortBy === 'title') {
        filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'date') {
        filtered = filtered.sort((a, b) => b.year - a.year);
      }

      return filtered;
    } else {
      let filtered = musicNews.filter(item => {
        const matchesSearch = searchQuery === '' || 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
      });

      // Sort news
      if (sortBy === 'title') {
        filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'date') {
        filtered = filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      return filtered;
    }
  };

  // Get unique genres and years for filters
  const availableGenres = [...new Set(discogsReleases.flatMap(r => r.genre))];
  const availableYears = [...new Set(discogsReleases.map(r => r.year))].sort((a, b) => b - a);

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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

  const data = filteredData();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Navigation />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Muzieknieuws
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ontdek de nieuwste releases, muzieknieuws en trends in de muziekindustrie
          </p>
        </div>

        {/* Source Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={newsSource === 'discogs' ? 'default' : 'outline'}
            onClick={() => setNewsSource('discogs')}
            className="flex items-center gap-2"
          >
            <Disc3 className="w-4 h-4" />
            Nieuwe Releases
          </Button>
          <Button
            variant={newsSource === 'perplexity' ? 'default' : 'outline'}
            onClick={() => setNewsSource('perplexity')}
            className="flex items-center gap-2"
          >
            <Newspaper className="w-4 h-4" />
            Muzieknieuws
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-card p-6 rounded-lg mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Zoek in titels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Genre Filter (only for Discogs) */}
            {newsSource === 'discogs' && (
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle genres</SelectItem>
                  {availableGenres.slice(0, 10).map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Year Filter (only for Discogs) */}
            {newsSource === 'discogs' && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {availableYears.slice(0, 20).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sorteren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Datum</SelectItem>
                <SelectItem value="title">Titel</SelectItem>
                <SelectItem value="relevance">Relevantie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Weergave:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.length} {data.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>

        {/* Content */}
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
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(data as DiscogsRelease[]).map((release) => (
              <Card key={release.id} className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                {viewMode === 'list' && release.thumb && (
                  <div className="w-24 h-24 bg-muted flex-shrink-0">
                    <img 
                      src={release.thumb} 
                      alt={`${release.title} cover`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className={`${viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-1`}>
                      {release.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{release.artist} • {release.year}</p>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'grid' && release.thumb && (
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
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && newsSource === 'perplexity' && (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(data as NewsItem[]).map((item, index) => (
              <Card key={index} className={`group hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex' : ''}`}>
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className={`${viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-2`}>
                      {item.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.source} • {new Date(item.publishedAt).toLocaleDateString('nl-NL')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm mb-4 ${viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                      {item.summary}
                    </p>
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
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen resultaten gevonden</h3>
            <p className="text-muted-foreground">
              Pas je zoekcriteria aan om meer resultaten te zien.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}