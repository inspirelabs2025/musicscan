import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Newspaper, Search, Filter, Grid, List, Calendar, Eye, X, ChevronDown, FilterX } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { Helmet } from "react-helmet";

export default function Nieuws() {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters();
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  const { data: musicNews = [], isLoading, error } = useQuery({
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

  const availableOptions = useMemo(() => {
    const categories = [...new Set((musicNews as any[]).map(n => n.category).filter(Boolean))];
    const sources = [...new Set((musicNews as any[]).map(n => n.source).filter(Boolean))];
    return { categories, sources };
  }, [musicNews]);

  const filteredNews = useMemo(() => {
    let filtered = (musicNews as any[]).filter(news => {
      const matchesSearch = debouncedSearch === '' || 
        news.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        news.summary?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = filters.category === 'all' || news.category === filters.category;
      const matchesSource = filters.source === 'all' || news.source === filters.source;
      
      return matchesSearch && matchesCategory && matchesSource;
    });

    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.sortBy === 'date' || filters.sortBy === 'created_at') {
      filtered = filtered.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
    }
    
    return filtered;
  }, [musicNews, debouncedSearch, filters.category, filters.source, filters.sortBy]);

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Muzieknieuws - PlaatjesPraat</title>
        <meta name="description" content="Het laatste muzieknieuws en trends uit de muziekindustrie" />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📰 Muzieknieuws
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Het laatste nieuws en trends uit de muziekindustrie
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card p-6 rounded-lg mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Zoek in nieuws..." 
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
                <SelectItem value="date">Nieuwste eerst</SelectItem>
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
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle categorieën</SelectItem>
                    {availableOptions.categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
              {filteredNews.length} {filteredNews.length === 1 ? 'artikel' : 'artikelen'}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && <LoadingSkeleton />}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Er is een fout opgetreden bij het ophalen van het nieuws.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredNews.map((news: any) => (
              <Link 
                key={news.id}
                to={`/nieuws/${news.slug}`}
                className="block"
              >
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="flex-shrink-0">
                        <Newspaper className="w-3 h-3 mr-1" />
                        {news.category || 'Nieuws'}
                      </Badge>
                      <time className="text-xs text-muted-foreground flex-shrink-0">
                        {news.published_at ? new Date(news.published_at).toLocaleDateString('nl-NL') : ''}
                      </time>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {news.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {news.summary}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Geen nieuws gevonden met de geselecteerde filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
