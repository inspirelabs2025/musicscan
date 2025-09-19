import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, ArrowRight, Disc3, Newspaper, Search, Filter, Grid, List, Calendar, Star, Eye, FileText, X, RotateCcw, ChevronDown, FilterX } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useNavigate, Link } from "react-router-dom";
import { useDiscogsNews, DiscogsRelease } from "@/hooks/useNewsCache";
import { VerhaalTab } from "@/components/VerhaalTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
export default function MusicNews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'releases' | 'news' | 'verhalen'>('releases');
  
  // URL-based filter management
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters();
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  // Use the new cached hooks
  const { data: discogsReleases = [], isLoading: isLoadingDiscogs, error: discogsError } = useDiscogsNews();
  
  // Fetch news blog posts directly from database
  const { data: musicNews = [], isLoading: isLoadingPerplexity, error: perplexityError } = useQuery({
    queryKey: ["news-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_blog_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute available filter options
  const availableOptions = useMemo(() => {
    const genres = [...new Set((discogsReleases as any[]).flatMap(r => r.genre || []))];
    const years = [...new Set((discogsReleases as any[]).map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
    const categories = [...new Set((musicNews as any[]).map(n => n.category).filter(Boolean))];
    const sources = [...new Set((musicNews as any[]).map(n => n.source).filter(Boolean))];
    
    return { genres, years, categories, sources };
  }, [discogsReleases, musicNews]);

  const LoadingSkeleton = () => <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'releases' | 'news' | 'verhalen')} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3 min-w-max sm:min-w-0 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl mx-auto max-w-md">
              <TabsTrigger 
                value="releases" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
              >
                <Disc3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">🎵 Releases</span>
              </TabsTrigger>
              <TabsTrigger 
                value="news" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
              >
                <Newspaper className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">📰 Nieuws</span>
              </TabsTrigger>
              <TabsTrigger 
                value="verhalen" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">📚 Verhalen</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="releases" className="space-y-6 animate-fade-in">
            <ReleasesContent 
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
              debouncedSearch={debouncedSearch}
              discogsReleases={discogsReleases}
              isLoadingDiscogs={isLoadingDiscogs}
              discogsError={discogsError}
              navigate={navigate}
              availableOptions={availableOptions}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-6 animate-fade-in">
            <NewsContent
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
              debouncedSearch={debouncedSearch}
              musicNews={musicNews}
              isLoadingPerplexity={isLoadingPerplexity}
              perplexityError={perplexityError}
              availableOptions={availableOptions}
            />
          </TabsContent>

          <TabsContent value="verhalen" className="space-y-6 animate-fade-in">
            <VerhaalTab />
          </TabsContent>
        </Tabs>

      </main>
    </div>;
}

// Releases Tab Component
interface ReleasesContentProps {
  filters: any;
  updateFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  debouncedSearch: string;
  discogsReleases: any[];
  isLoadingDiscogs: boolean;
  discogsError: any;
  navigate: any;
  availableOptions: {
    genres: string[];
    years: number[];
    categories: string[];
    sources: string[];
  };
}

function ReleasesContent({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  debouncedSearch,
  discogsReleases,
  isLoadingDiscogs,
  discogsError,
  navigate,
  availableOptions
}: ReleasesContentProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter logic for releases
  const filteredReleases = useMemo(() => {
    let filtered = (discogsReleases as any[]).filter(release => {
      const matchesSearch = debouncedSearch === '' || 
        release.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        release.artist?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesGenre = filters.genre === 'all' || 
        (release.genre && release.genre.some && release.genre.some((g: string) => g.toLowerCase().includes(filters.genre.toLowerCase())));
      const matchesYear = filters.year === 'all' || 
        (release.year && release.year.toString() === filters.year);
      return matchesSearch && matchesGenre && matchesYear;
    });

    // Sort releases
    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.sortBy === 'date') {
      filtered = filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    return filtered;
  }, [discogsReleases, debouncedSearch, filters.genre, filters.year, filters.sortBy]);

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
    <>
      {/* Enhanced Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg mb-8 border">
        {/* Primary Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Zoek in releases..." 
              value={filters.search} 
              onChange={e => updateFilter('search', e.target.value)} 
              className="pl-10" 
            />
          </div>

          {/* Quick Sort */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Nieuwste eerst</SelectItem>
              <SelectItem value="title">Alfabetisch</SelectItem>
              <SelectItem value="relevance">Relevantie</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Geavanceerde filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
              <FilterX className="w-4 h-4 mr-2" />
              Reset filters
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {/* Genre Filter */}
              <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle genres</SelectItem>
                  {availableOptions.genres.slice(0, 15).map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Filter */}
              <Select value={filters.year} onValueChange={(value) => updateFilter('year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {availableOptions.years.slice(0, 25).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* View Mode and Results Count */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Weergave:</span>
            <Button 
              variant={filters.viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => updateFilter('viewMode', 'grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={filters.viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => updateFilter('viewMode', 'list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredReleases.length} {filteredReleases.length === 1 ? 'release' : 'releases'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoadingDiscogs && <LoadingSkeleton />}
      
      {discogsError && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {typeof discogsError === 'string' ? discogsError : 'Er is een fout opgetreden bij het ophalen van de releases.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!isLoadingDiscogs && !discogsError && (
        <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredReleases.map((release: any) => (
            <Card key={release.id} className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${filters.viewMode === 'list' ? 'flex' : ''}`}>
              {filters.viewMode === 'list' && (release.stored_image || release.thumb || release.artwork) && (
                <div className="w-24 h-24 bg-muted flex-shrink-0">
                  <img 
                    src={release.stored_image || release.thumb || release.artwork} 
                    alt={`${release.title} cover`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (release.stored_image && e.currentTarget.src === release.stored_image) {
                        e.currentTarget.src = release.thumb || release.artwork || '';
                      }
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className={`${filters.viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-1`}>
                    {release.title || 'Onbekende titel'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {release.artist || 'Onbekende artiest'} • {release.year || 'Jaar onbekend'}
                  </p>
                </CardHeader>
                <CardContent>
                  {filters.viewMode === 'grid' && (release.stored_image || release.thumb || release.artwork) && (
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={release.stored_image || release.thumb || release.artwork} 
                        alt={`${release.title} cover`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
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
                    {release.format && typeof release.format === 'string' && (
                      <p className="text-xs text-muted-foreground">
                        Format: {release.format}
                      </p>
                    )}
                    {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Genre: {release.genre.slice(0, 2).join(', ')}
                      </p>
                    )}
                    {release.genre && typeof release.genre === 'string' && (
                      <p className="text-xs text-muted-foreground">
                        Genre: {release.genre}
                      </p>
                    )}
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
                          <ArrowRight className="w-3 h-3" />
                          Discogs
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingDiscogs && !discogsError && filteredReleases.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen releases gevonden</h3>
          <p className="text-muted-foreground">
            Probeer de filters aan te passen om meer resultaten te zien.
          </p>
        </div>
      )}
    </>
  );
}

// News Tab Component  
interface NewsContentProps {
  filters: any;
  updateFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  debouncedSearch: string;
  musicNews: any[];
  isLoadingPerplexity: boolean;
  perplexityError: any;
  availableOptions: {
    genres: string[];
    years: number[];
    categories: string[];
    sources: string[];
  };
}

function NewsContent({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  debouncedSearch,
  musicNews,
  isLoadingPerplexity,
  perplexityError,
  availableOptions
}: NewsContentProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Date range filter helper
  const getDateRangeFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };
  
  // Enhanced filter logic for news
  const filteredNews = useMemo(() => {
    let filtered = (musicNews as any[]).filter(item => {
      const matchesSearch = debouncedSearch === '' || 
        item.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        item.summary?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.source?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || 
        item.category?.toLowerCase() === filters.category.toLowerCase();
      
      const matchesSource = filters.source === 'all' || 
        item.source?.toLowerCase() === filters.source.toLowerCase();
      
      const dateRangeFilter = getDateRangeFilter(filters.dateRange);
      const matchesDateRange = !dateRangeFilter || 
        (item.published_at && new Date(item.published_at) >= dateRangeFilter);
      
      return matchesSearch && matchesCategory && matchesSource && matchesDateRange;
    });

    // Enhanced sorting
    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.sortBy === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
    } else if (filters.sortBy === 'relevance') {
      // Sort by combination of date and search relevance
      filtered = filtered.sort((a, b) => {
        const dateScore = new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
        return dateScore;
      });
    }
    return filtered;
  }, [musicNews, debouncedSearch, filters.category, filters.source, filters.dateRange, filters.sortBy, getDateRangeFilter]);

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
    <>
      {/* Enhanced Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg mb-8 border">
        {/* Primary Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Zoek in nieuws..." 
              value={filters.search} 
              onChange={e => updateFilter('search', e.target.value)} 
              className="pl-10" 
            />
          </div>

          {/* Quick Sort */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Nieuwste eerst</SelectItem>
              <SelectItem value="title">Alfabetisch</SelectItem>
              <SelectItem value="relevance">Relevantie</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Geavanceerde filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
              <FilterX className="w-4 h-4 mr-2" />
              Reset filters
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Category Filter */}
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {availableOptions.categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Source Filter */}
              <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Bron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle bronnen</SelectItem>
                  {availableOptions.sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle periodes</SelectItem>
                  <SelectItem value="week">Afgelopen week</SelectItem>
                  <SelectItem value="month">Afgelopen maand</SelectItem>
                  <SelectItem value="year">Afgelopen jaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Presets */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  updateFilter('dateRange', 'week');
                  updateFilter('sortBy', 'date');
                }}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Deze week
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  updateFilter('sortBy', 'relevance');
                  updateFilter('dateRange', 'month');
                }}
              >
                <Star className="w-3 h-3 mr-1" />
                Populair
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* View Mode and Results Count */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Weergave:</span>
            <Button 
              variant={filters.viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => updateFilter('viewMode', 'grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={filters.viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => updateFilter('viewMode', 'list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredNews.length} {filteredNews.length === 1 ? 'artikel' : 'artikelen'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoadingPerplexity && <LoadingSkeleton />}
      
      {perplexityError && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {typeof perplexityError === 'string' ? perplexityError : 'Er is een fout opgetreden bij het ophalen van het nieuws.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!isLoadingPerplexity && !perplexityError && (
        <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredNews.map((item, index) => (
            <Card key={item.id || index} className={`group hover:shadow-lg transition-all duration-300 ${filters.viewMode === 'list' ? 'flex' : ''}`}>
              <div className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className={`${filters.viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-2`}>
                    {/* Highlight search terms */}
                    {debouncedSearch && item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ? (
                      <span dangerouslySetInnerHTML={{
                        __html: item.title.replace(
                          new RegExp(`(${debouncedSearch})`, 'gi'),
                          '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                        )
                      }} />
                    ) : (
                      item.title
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {item.source} • {new Date(item.published_at).toLocaleDateString('nl-NL')}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm mb-4 ${filters.viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                    {/* Highlight search terms in summary */}
                    {debouncedSearch && item.summary?.toLowerCase().includes(debouncedSearch.toLowerCase()) ? (
                      <span dangerouslySetInnerHTML={{
                        __html: item.summary.replace(
                          new RegExp(`(${debouncedSearch})`, 'gi'),
                          '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                        )
                      }} />
                    ) : (
                      item.summary
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    {item.slug && (
                      <Link 
                        to={`/nieuws/${item.slug}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                      >
                        Lees meer <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingPerplexity && !perplexityError && filteredNews.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen nieuws gevonden</h3>
          <p className="text-muted-foreground mb-4">
            {debouncedSearch || activeFilterCount > 0 
              ? 'Geen artikelen gevonden die voldoen aan je criteria.'
              : 'Er zijn momenteel geen nieuwsartikelen beschikbaar.'
            }
          </p>
          {(debouncedSearch || activeFilterCount > 0) && (
            <Button variant="outline" onClick={resetFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Reset alle filters
            </Button>
          )}
        </div>
      )}
    </>
  );
}