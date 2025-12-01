import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, ArrowRight, Newspaper, Search, Filter, Grid, List, FileText, ChevronDown, FilterX } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useNavigate, Link } from "react-router-dom";
import { useSpotifyNewReleases } from "@/hooks/useSpotifyNewReleases";
import { VerhaalTab } from "@/components/VerhaalTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function MusicNews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'releases' | 'news' | 'verhalen'>('releases');
  
  // URL-based filter management
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters();
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  // Use Spotify releases from database
  const { data: spotifyReleases = [], isLoading: isLoadingReleases, error: releasesError } = useSpotifyNewReleases();
  
  // Fetch news blog posts directly from database
  const { data: musicNews = [], isLoading: isLoadingNews, error: newsError } = useQuery({
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
    staleTime: 5 * 60 * 1000,
  });

  // Compute available filter options
  const availableOptions = useMemo(() => {
    const categories = [...new Set((musicNews as any[]).map(n => n.category).filter(Boolean))];
    const sources = [...new Set((musicNews as any[]).map(n => n.source).filter(Boolean))];
    
    return { categories, sources };
  }, [musicNews]);

  const LoadingSkeleton = () => (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

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
                <Music className="h-3 w-3 sm:h-4 sm:w-4" />
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
              spotifyReleases={spotifyReleases}
              isLoading={isLoadingReleases}
              error={releasesError}
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
              isLoading={isLoadingNews}
              error={newsError}
              availableOptions={availableOptions}
            />
          </TabsContent>

          <TabsContent value="verhalen" className="space-y-6 animate-fade-in">
            <VerhaalTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Releases Tab Component
interface ReleasesContentProps {
  filters: any;
  updateFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  debouncedSearch: string;
  spotifyReleases: any[];
  isLoading: boolean;
  error: any;
}

function ReleasesContent({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  debouncedSearch,
  spotifyReleases,
  isLoading,
  error
}: ReleasesContentProps) {
  // Filter logic for releases
  const filteredReleases = useMemo(() => {
    let filtered = spotifyReleases.filter(release => {
      const matchesSearch = debouncedSearch === '' || 
        release.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        release.artist?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });

    // Sort releases
    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'created_at' || filters.sortBy === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    }
    return filtered;
  }, [spotifyReleases, debouncedSearch, filters.sortBy]);

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
      {/* Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg mb-8 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <SelectItem value="created_at">Nieuwste eerst</SelectItem>
              <SelectItem value="title">Alfabetisch</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
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
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredReleases.length} {filteredReleases.length === 1 ? 'release' : 'releases'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingSkeleton />}
      
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            Er is een fout opgetreden bij het ophalen van de releases.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredReleases.map((release: any) => (
            <a
              key={release.id}
              href={release.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${filters.viewMode === 'list' ? 'flex' : ''}`}>
                {filters.viewMode === 'list' && release.image_url && (
                  <div className="w-24 h-24 bg-muted flex-shrink-0">
                    <img 
                      src={release.image_url} 
                      alt={release.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className={`${filters.viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-1`}>
                      {release.name || 'Onbekende titel'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {release.artist || 'Onbekende artiest'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {filters.viewMode === 'grid' && release.image_url && (
                      <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={release.image_url} 
                          alt={release.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {format(new Date(release.release_date), 'd MMM yyyy', { locale: nl })}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                        Spotify
                      </Badge>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredReleases.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Geen releases gevonden</h3>
          <p className="text-muted-foreground">
            Probeer je zoekterm aan te passen
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
  isLoading: boolean;
  error: any;
  availableOptions: {
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
  isLoading,
  error,
  availableOptions
}: NewsContentProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter logic for news
  const filteredNews = useMemo(() => {
    let filtered = musicNews.filter((item: any) => {
      const matchesSearch = debouncedSearch === '' || 
        item.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.summary?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesSource = filters.source === 'all' || item.source === filters.source;
      return matchesSearch && matchesCategory && matchesSource;
    });

    // Sort news
    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
    } else {
      filtered = filtered.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }
    return filtered;
  }, [musicNews, debouncedSearch, filters.category, filters.source, filters.sortBy]);

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
      {/* Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg mb-8 border">
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
              <SelectItem value="created_at">Nieuwste eerst</SelectItem>
              <SelectItem value="title">Alfabetisch</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
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
              {/* Category Filter */}
              <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value)}>
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
              <Select value={filters.source || 'all'} onValueChange={(value) => updateFilter('source', value)}>
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
      {isLoading && <LoadingSkeleton />}
      
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            Er is een fout opgetreden bij het ophalen van het nieuws.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredNews.map((item: any) => (
            <Link key={item.id} to={`/nieuws/${item.slug}`}>
              <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden h-full ${filters.viewMode === 'list' ? 'flex' : ''}`}>
                {filters.viewMode === 'list' && item.image_url && (
                  <div className="w-24 h-24 bg-muted flex-shrink-0">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className={`${filters.viewMode === 'list' ? 'text-base' : 'text-lg'} line-clamp-2`}>
                      {item.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.source} • {format(new Date(item.published_at), 'd MMM yyyy', { locale: nl })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {filters.viewMode === 'grid' && item.image_url && (
                      <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <p className="text-sm mb-4 line-clamp-3">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm group-hover:gap-2 transition-all duration-200">
                        Lees meer <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredNews.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Geen nieuws gevonden</h3>
          <p className="text-muted-foreground">
            Probeer je zoekterm of filters aan te passen
          </p>
        </div>
      )}
    </>
  );
}
