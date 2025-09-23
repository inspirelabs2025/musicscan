import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Tag, 
  FileText, 
  TrendingUp, 
  Clock, 
  Grid, 
  List,
  RotateCcw,
  Lightbulb,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlaatVerhaalBlogCard } from "./PlaatVerhaalBlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { usePaginatedBlogs } from "@/hooks/usePaginatedBlogs";

export const VerhaalTab: React.FC = () => {
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const {
    filters,
    updateFilter,
    resetFilters
  } = useUrlFilters();

  const debouncedSearch = useDebounceSearch(filters.search || '', 300);
  
  const {
    blogs,
    totalCount,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch
  } = usePaginatedBlogs({
    search: debouncedSearch,
    status: filters.status as 'all' | 'published' | 'draft',
    albumType: filters.albumType,
    dateRange: filters.dateRange as 'all' | 'week' | 'month' | 'year',
    sortBy: filters.sortBy as 'created_at' | 'views_count' | 'updated_at',
    sortOrder: 'desc'
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleView = (blog: any) => {
    if (blog.is_published) {
      navigate(`/plaat-verhaal/${blog.slug}`);
    } else {
      navigate(`/plaat-verhaal/${blog.slug}`);
    }
  };

  const handleEdit = (blog: any) => {
    console.log('Edit blog:', blog);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">📚 Plaat & Verhaal</h2>
          <p className="text-muted-foreground">
            Overzicht van alle gegenereerde verhalen over je albums
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Vernieuwen
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Zoek in verhalen..." 
              value={filters.search || ''} 
              onChange={e => updateFilter('search', e.target.value)} 
              className="pl-10" 
            />
          </div>

          {/* Sort */}
          <Select value={filters.sortBy || 'created_at'} onValueChange={value => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Nieuwste eerst</SelectItem>
              <SelectItem value="views_count">Meest bekeken</SelectItem>
              <SelectItem value="update_at">Laatst bewerkt</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* View Mode */}
          <div className="flex items-center gap-2">
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

        {/* Advanced Filters */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Status Filter */}
              <Select value={filters.status || 'all'} onValueChange={value => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="draft">Concepten</SelectItem>
                </SelectContent>
              </Select>

              {/* Album Type Filter */}
              <Select value={filters.albumType || 'all'} onValueChange={value => updateFilter('albumType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Album Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="ai">AI Scan</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={filters.dateRange || 'all'} onValueChange={value => updateFilter('dateRange', value)}>
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
                  updateFilter('status', 'published');
                  updateFilter('sortBy', 'views_count');
                }}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Populair
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  updateFilter('dateRange', 'week');
                  updateFilter('sortBy', 'created_at');
                }}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Recent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  updateFilter('status', 'draft');
                  updateFilter('sortBy', 'created_at');
                }}
              >
                <Clock className="w-3 h-3 mr-1" />
                Drafts
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {blogs.length} verhalen {totalCount > 0 && `(${totalCount} totaal)`}
          </Badge>
          {isFetching && !isLoading && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Laden...
            </Badge>
          )}
        </div>
      </div>

      <div className={`grid gap-6 ${
        filters.viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {blogs.map((blog) => (
          <PlaatVerhaalBlogCard
            key={blog.id}
            blog={{
              ...blog,
              markdown_content: '', // Not needed for card display
              published_at: blog.published_at || blog.created_at,
              album_type: (blog.album_type as 'cd' | 'vinyl') || 'cd'
            }}
            onView={handleView}
            onEdit={handleEdit}
            viewMode={filters.viewMode as 'grid' | 'list'}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            size="lg"
            disabled={isFetchingNextPage}
            className="flex items-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Laden...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Meer verhalen laden
              </>
            )}
          </Button>
        </div>
      )}

      {blogs.length === 0 && !isLoading && (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nog geen verhalen gevonden
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Het lijkt erop dat je nog geen verhalen hebt gegenereerd. Scan een paar albums om te beginnen!
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    💡 Tip: Genereer meer verhalen
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Ga naar je collectie en genereer verhalen voor je albums. Elk verhaal krijgt een unieke plaat & verhaal pagina!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {blogs.length > 0 && (
        <Card className="p-6 bg-muted/50">
          <div className="text-center">
            <h4 className="font-medium text-muted-foreground mb-2">
              💡 Tip: Genereer meer verhalen
            </h4>
            <p className="text-sm text-muted-foreground">
              Je kunt nieuwe Plaat & Verhaal artikelen genereren door naar je collectie te gaan 
              en op de "Plaat & Verhaal" knop te klikken bij albums.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};