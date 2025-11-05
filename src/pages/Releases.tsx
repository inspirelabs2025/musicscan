import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Disc3, Search, Filter, Grid, List, ChevronDown, FilterX } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useNavigate } from "react-router-dom";
import { useDiscogsNews } from "@/hooks/useNewsCache";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { Helmet } from "react-helmet";

export default function Releases() {
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters();
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  const { data: discogsReleases = [], isLoading, error } = useDiscogsNews();

  const availableOptions = useMemo(() => {
    const genres = [...new Set((discogsReleases as any[]).flatMap(r => r.genre || []))];
    const years = [...new Set((discogsReleases as any[]).map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
    return { genres, years };
  }, [discogsReleases]);

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

    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.sortBy === 'created_at' || filters.sortBy === 'date') {
      filtered = filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    return filtered;
  }, [discogsReleases, debouncedSearch, filters.genre, filters.year, filters.sortBy]);

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Nieuwe Releases - PlaatjesPraat</title>
        <meta name="description" content="Ontdek de nieuwste muziek releases en albums" />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Nieuwe Releases
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De nieuwste releases en albums uit de muziekwereld
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card p-6 rounded-lg mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Zoek in releases..." 
                value={filters.search} 
                onChange={e => updateFilter('search', e.target.value)} 
                className="pl-10" 
              />
            </div>

            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sorteren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Nieuwste eerst</SelectItem>
                <SelectItem value="title">Alfabetisch</SelectItem>
              </SelectContent>
            </Select>

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

            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
                <FilterX className="w-4 h-4 mr-2" />
                Reset filters
              </Button>
            )}
          </div>

          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
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
        {isLoading && <LoadingSkeleton />}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Er is een fout opgetreden bij het ophalen van de releases.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {!isLoading && !error && (
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
                      {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {release.genre.slice(0, 3).map((genre: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredReleases.length === 0 && (
          <div className="text-center py-12">
            <Disc3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Geen releases gevonden met de geselecteerde filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
