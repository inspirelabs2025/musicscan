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
  ChevronDown,
  Music
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
import { useMuziekVerhalen } from "@/hooks/useMuziekVerhalen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const VerhaalTab: React.FC = () => {
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'albums' | 'singles'>('albums');
  
  const {
    filters,
    updateFilter,
    resetFilters
  } = useUrlFilters();
  
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const debouncedSearch = useDebounceSearch(searchInput, 300);
  
  // Update URL filter when debounced search changes
  React.useEffect(() => {
    updateFilter('search', debouncedSearch);
  }, [debouncedSearch]);
  
  // Album stories (existing blog posts)
  const {
    blogs,
    totalCount,
    isLoading: isLoadingBlogs,
    isFetching: isFetchingBlogs,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchBlogs
  } = usePaginatedBlogs({
    search: debouncedSearch,
    status: filters.status as 'all' | 'published' | 'draft',
    albumType: filters.albumType,
    dateRange: filters.dateRange as 'all' | 'week' | 'month' | 'year',
    sortBy: filters.sortBy as 'created_at' | 'views_count' | 'updated_at',
    sortOrder: 'desc'
  });

  // Single stories (music stories)
  const { 
    data: musicStories = [], 
    isLoading: isLoadingStories, 
    refetch: refetchStories 
  } = useMuziekVerhalen();

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'albums') {
      refetchBlogs();
    } else {
      refetchStories();
    }
  }, [activeTab, refetchBlogs, refetchStories]);

  const handleReset = useCallback(() => {
    setSearchInput('');
    resetFilters();
  }, [resetFilters]);

  const handleViewBlog = (blog: any) => {
    navigate(`/plaat-verhaal/${blog.slug}`);
  };

  const handleViewStory = (story: any) => {
    navigate(`/muziek-verhaal/${story.slug}`);
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

  const isLoading = activeTab === 'albums' ? isLoadingBlogs : isLoadingStories;
  const isFetching = activeTab === 'albums' ? isFetchingBlogs : false;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">📚 Muziekverhalen</h2>
          <p className="text-muted-foreground">
            Ontdek verhalen over albums en singles
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

      {/* Tabs for Albums vs Singles */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'albums' | 'singles')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="albums" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Albums
          </TabsTrigger>
          <TabsTrigger value="singles" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Singles
          </TabsTrigger>
        </TabsList>

      {/* Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Zoek in verhalen..." 
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)} 
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
              <SelectItem value="updated_at">Laatst bewerkt</SelectItem>
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
                  <SelectItem value="release">Release</SelectItem>
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
                onClick={handleReset}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <TabsContent value="albums" className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {blogs.length} album verhalen {totalCount > 0 && `(${totalCount} totaal)`}
            </Badge>
            {isFetchingBlogs && !isLoadingBlogs && (
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
              onView={handleViewBlog}
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

        {blogs.length === 0 && !isLoadingBlogs && (
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nog geen album verhalen gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Het lijkt erop dat je nog geen album verhalen hebt gegenereerd. Scan een paar albums om te beginnen!
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="singles" className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {musicStories.length} single verhalen
            </Badge>
            {isLoadingStories && (
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
          {musicStories.map((story) => (
            <Card 
              key={story.id} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => handleViewStory(story)}
            >
              {/* Album Cover */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60">
                  {story.artwork_url ? (
                    <img
                      src={story.artwork_url}
                      alt={`${story.artist || story.query} artwork`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full bg-gradient-to-br from-vinyl-gold/20 to-primary/20 flex items-center justify-center" style={{ display: story.artwork_url ? 'none' : 'flex' }}>
                    <Music className="w-16 h-16 text-muted-foreground/60" />
                  </div>
                </div>
                
                {/* Overlay Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant="outline" className="text-xs shadow-sm backdrop-blur-sm bg-primary/10 border-primary/30">
                    Single
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {story.artist && story.single_name ? `${story.artist} - ${story.single_name}` : story.query}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(story.created_at).toLocaleDateString('nl-NL')}
                      {story.reading_time && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          {story.reading_time} min
                        </>
                      )}
                      <span>•</span>
                      <Eye className="w-3 h-3" />
                      {story.views_count || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {musicStories.length === 0 && !isLoadingStories && (
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nog geen single verhalen gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Het lijkt erop dat je nog geen single verhalen hebt gegenereerd. Ga naar het dashboard om je eerste verhaal te maken!
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      </Tabs>

    </div>
  );
};