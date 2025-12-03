import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Disc3, Search, Grid, List, ExternalLink, FilterX } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useSpotifyNewReleases } from "@/hooks/useSpotifyNewReleases";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { Helmet } from "react-helmet";

export default function Releases() {
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters();
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  const { data: spotifyReleases = [], isLoading, error } = useSpotifyNewReleases();

  const filteredReleases = useMemo(() => {
    let filtered = spotifyReleases.filter(release => {
      const matchesSearch = debouncedSearch === '' || 
        release.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        release.artist?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });

    if (filters.sortBy === 'title') {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'created_at' || filters.sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    }
    return filtered;
  }, [spotifyReleases, debouncedSearch, filters.sortBy]);

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

  const getReleaseYear = (releaseDate: string) => {
    return releaseDate ? new Date(releaseDate).getFullYear() : 'Onbekend';
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Nieuwe Releases - Spotify New Releases | PlaatjesPraat</title>
        <meta name="description" content="Ontdek de nieuwste muziek releases en albums op Spotify" />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Nieuwe Releases
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De nieuwste releases en albums op Spotify
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card p-6 rounded-lg mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Zoek op artiest of album..." 
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

            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
                <FilterX className="w-4 h-4 mr-2" />
                Reset filters
              </Button>
            )}
          </div>

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
            {filteredReleases.map((release) => {
              const releaseSlug = (release as any).slug;
              const linkTo = releaseSlug ? `/new-release/${releaseSlug}` : undefined;
              
              return (
                <Card 
                  key={release.id} 
                  className={`group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${filters.viewMode === 'list' ? 'flex' : ''}`}
                  onClick={() => linkTo && window.location.assign(linkTo)}
                >
                  {filters.viewMode === 'list' && release.image_url && (
                    <div className="w-24 h-24 bg-muted flex-shrink-0">
                      <img 
                        src={release.image_url} 
                        alt={`${release.name} cover`} 
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
                        {release.artist || 'Onbekende artiest'} • {getReleaseYear(release.release_date)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {filters.viewMode === 'grid' && release.image_url && (
                        <div className="w-full aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={release.image_url} 
                            alt={`${release.name} cover`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        {linkTo && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); window.location.assign(linkTo); }}
                          >
                            Bekijk details
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={linkTo ? '' : 'w-full'}
                          onClick={(e) => { e.stopPropagation(); window.open(release.spotify_url, '_blank'); }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Spotify
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
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
