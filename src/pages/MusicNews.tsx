import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, ExternalLink, Disc3, Newspaper, Search, Filter, Grid, List, Calendar, Star, Eye } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { useDiscogsNews, usePerplexityNews, DiscogsRelease, NewsItem } from "@/hooks/useNewsCache";
export default function MusicNews() {
  const navigate = useNavigate();
  const [newsSource, setNewsSource] = useState<'discogs' | 'perplexity'>('discogs');
  
  // Enhanced state for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'relevance'>('date');

  // Use the new cached hooks
  const { data: discogsReleases = [], isLoading: isLoadingDiscogs, error: discogsError } = useDiscogsNews();
  const { data: musicNews = [], isLoading: isLoadingPerplexity, error: perplexityError } = usePerplexityNews();

  const loading = newsSource === 'discogs' ? isLoadingDiscogs : isLoadingPerplexity;
  const error = newsSource === 'discogs' ? discogsError : perplexityError;

  // Debug logging
  console.log('📊 MusicNews Debug:', {
    newsSource,
    discogsCount: discogsReleases?.length || 0,
    perplexityCount: musicNews?.length || 0,
    loading,
    error: error?.message || error,
    discogsData: discogsReleases?.slice(0, 2) // Log first 2 items for debugging
  });
  // Filter and sort logic
  const filteredData = () => {
    if (newsSource === 'discogs') {
      let filtered = (discogsReleases as any[]).filter(release => {
        const matchesSearch = searchQuery === '' || 
          release.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          release.artist?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || 
          (release.genre && release.genre.some && release.genre.some((g: string) => g.toLowerCase().includes(selectedGenre.toLowerCase())));
        const matchesYear = selectedYear === 'all' || 
          (release.year && release.year.toString() === selectedYear);
        return matchesSearch && matchesGenre && matchesYear;
      });

      // Sort releases
      if (sortBy === 'title') {
        filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sortBy === 'date') {
        filtered = filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
      }
      return filtered;
    } else {
      let filtered = (musicNews as any[]).filter(item => {
        const matchesSearch = searchQuery === '' || 
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });

      // Sort news
      if (sortBy === 'title') {
        filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sortBy === 'date') {
        filtered = filtered.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      }
      return filtered;
    }
  };

  // Get unique genres and years for filters
  const availableGenres = [...new Set((discogsReleases as any[]).flatMap(r => r.genre || []))];
  const availableYears = [...new Set((discogsReleases as any[]).map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
  const LoadingSkeleton = () => <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({
      length: 6
    }).map((_, i) => <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>)}
    </div>;
  const data = filteredData();
  
  // Debug filtered data
  console.log('🎯 Filtered Data Debug:', {
    dataLength: data?.length || 0,
    firstItem: data?.[0],
    newsSource,
    filters: { searchQuery, selectedGenre, selectedYear }
  });
  
  return <div className="min-h-screen bg-background">

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
          <Button variant={newsSource === 'discogs' ? 'default' : 'outline'} onClick={() => setNewsSource('discogs')} className="flex items-center gap-2">
            <Disc3 className="w-4 h-4" />
            Nieuwe Releases
          </Button>
          <Button variant={newsSource === 'perplexity' ? 'default' : 'outline'} onClick={() => setNewsSource('perplexity')} className="flex items-center gap-2">
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
              <Input placeholder="Zoek in titels..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            {/* Genre Filter (only for Discogs) */}
            {newsSource === 'discogs' && <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle genres</SelectItem>
                  {availableGenres.slice(0, 10).map(genre => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
                </SelectContent>
              </Select>}

            {/* Year Filter (only for Discogs) */}
            {newsSource === 'discogs' && <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {availableYears.slice(0, 20).map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                </SelectContent>
              </Select>}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'relevance') => setSortBy(value)}>
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
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
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
        
        {error && <div className="text-center py-8">
            <p className="text-destructive mb-4">
              {typeof error === 'string' ? error : 'Er is een fout opgetreden bij het ophalen van de gegevens.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Opnieuw proberen
            </Button>
          </div>}

        {!loading && !error && newsSource === 'discogs' && <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(data as any[]).map((release: any) => <Card key={release.id} className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                {viewMode === 'list' && (release.stored_image || release.thumb || release.artwork) && <div className="w-24 h-24 bg-muted flex-shrink-0">
                    <img 
                      src={release.stored_image || release.thumb || release.artwork} 
                      alt={`${release.title} cover`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to original thumb if stored image fails
                        if (release.stored_image && e.currentTarget.src === release.stored_image) {
                          e.currentTarget.src = release.thumb || release.artwork || '';
                        }
                      }}
                    />
                  </div>}
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className={`${viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-1`}>
                      {release.title || 'Onbekende titel'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{release.artist || 'Onbekende artiest'} • {release.year || 'Jaar onbekend'}</p>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'grid' && (release.stored_image || release.thumb || release.artwork) && <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
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
                      </div>}
                    <div className="space-y-2">
                    {release.format && Array.isArray(release.format) && release.format.length > 0 && <p className="text-xs text-muted-foreground">
                        Format: {release.format.join(', ')}
                      </p>}
                    {release.format && typeof release.format === 'string' && <p className="text-xs text-muted-foreground">
                        Format: {release.format}
                      </p>}
                   {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && <p className="text-xs text-muted-foreground">
                        Genre: {release.genre.slice(0, 2).join(', ')}
                      </p>}
                   {release.genre && typeof release.genre === 'string' && <p className="text-xs text-muted-foreground">
                        Genre: {release.genre}
                      </p>}
                       <div className="flex items-center gap-2 mt-3">
                         {release.release_id && (
                           <Button 
                             size="sm" 
                             onClick={() => navigate(`/release/${release.release_id}`)}
                             className="flex items-center gap-1"
                           >
                             <Eye className="w-3 h-3" />
                             Bekijk Details
                           </Button>
                         )}
                         <Button 
                           variant="outline" 
                           size="sm" 
                           asChild
                         >
                           <a 
                             href={`https://www.discogs.com${release.uri}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-1"
                           >
                             <ExternalLink className="w-3 h-3" />
                             Discogs
                           </a>
                         </Button>
                       </div>
                    </div>
                  </CardContent>
                </div>
              </Card>)}
          </div>}

        {!loading && !error && newsSource === 'perplexity' && <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(data as NewsItem[]).map((item, index) => <Card key={index} className={`group hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex' : ''}`}>
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
                      {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                          Lees meer <ExternalLink className="w-3 h-3" />
                        </a>}
                    </div>
                  </CardContent>
                </div>
              </Card>)}
          </div>}

        {!loading && !error && data.length === 0 && <div className="text-center py-12">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen resultaten gevonden</h3>
            <p className="text-muted-foreground">
              {newsSource === 'discogs' 
                ? 'Probeer de filters aan te passen of probeer later opnieuw.' 
                : 'Pas je zoekcriteria aan om meer resultaten te zien.'
              }
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Debug: {newsSource} - {data?.length || 0} items - Loading: {loading ? 'Yes' : 'No'} - Error: {error ? 'Yes' : 'No'}
            </div>
          </div>}
      </main>
    </div>;
}