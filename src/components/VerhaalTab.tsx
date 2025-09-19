import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlaatVerhaalBlogCard } from '@/components/PlaatVerhaalBlogCard';
import { usePlaatVerhaalGenerator } from '@/hooks/usePlaatVerhaalGenerator';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { FileText, Plus, RefreshCw, Search, Filter, Grid, List, ChevronDown, FilterX, Calendar, Eye, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BlogPost {
  id: string;
  album_id: string;
  album_type: 'cd' | 'vinyl';
  yaml_frontmatter: Record<string, any>;
  markdown_content: string;
  social_post?: string;
  product_card?: Record<string, any>;
  slug: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  published_at?: string;
}

export const VerhaalTab: React.FC = () => {
  const navigate = useNavigate();
  const { getUserBlogs } = usePlaatVerhaalGenerator();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // URL-based filter management
  const { filters, updateFilter, resetFilters, activeFilterCount } = useUrlFilters({
    viewMode: 'grid',
    sortBy: 'date',
    status: 'all',
    albumType: 'all',
    dateRange: 'all'
  });
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(filters.search, 300);

  // Date range filter helper
  const getDateRangeFilter = (range: string, blog: BlogPost) => {
    if (range === 'all') return true;
    
    const now = new Date();
    const blogDate = new Date(blog.published_at || blog.created_at);
    
    switch (range) {
      case 'week':
        return blogDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return blogDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return blogDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  };

  // Compute available filter options
  const availableOptions = useMemo(() => {
    const genres = [...new Set(blogs.flatMap(b => b.yaml_frontmatter?.genre || []))].filter(Boolean);
    const years = [...new Set(blogs.map(b => b.yaml_frontmatter?.year).filter(Boolean))].sort((a, b) => b - a);
    const albumTypes = [...new Set(blogs.map(b => b.album_type).filter(Boolean))];
    
    return { genres, years, albumTypes };
  }, [blogs]);

  // Enhanced filter logic
  const filteredBlogs = useMemo(() => {
    let filtered = blogs.filter(blog => {
      // Search filter
      const searchMatches = debouncedSearch === '' || 
        blog.yaml_frontmatter?.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        blog.yaml_frontmatter?.artist?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        blog.yaml_frontmatter?.album?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        blog.yaml_frontmatter?.genre?.some((g: string) => g.toLowerCase().includes(debouncedSearch.toLowerCase()));

      // Status filter
      const statusMatches = filters.status === 'all' || 
        (filters.status === 'published' && blog.is_published) ||
        (filters.status === 'draft' && !blog.is_published);

      // Album type filter
      const albumTypeMatches = filters.albumType === 'all' || blog.album_type === filters.albumType;

      // Date range filter
      const dateRangeMatches = getDateRangeFilter(filters.dateRange, blog);

      return searchMatches && statusMatches && albumTypeMatches && dateRangeMatches;
    });

    // Sort blogs
    if (filters.sortBy === 'title') {
      filtered = filtered.sort((a, b) => (a.yaml_frontmatter?.title || '').localeCompare(b.yaml_frontmatter?.title || ''));
    } else if (filters.sortBy === 'views') {
      filtered = filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (filters.sortBy === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
    }
    
    return filtered;
  }, [blogs, debouncedSearch, filters.status, filters.albumType, filters.dateRange, filters.sortBy]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const allBlogs = await getUserBlogs();
      setBlogs(allBlogs);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleView = (blog: BlogPost) => {
    if (blog.is_published) {
      navigate(`/plaat-verhaal/${blog.slug}`);
    } else {
      // For concepts, we could open an edit modal or preview
      // For now, let's navigate to the same URL but show it as preview
      navigate(`/plaat-verhaal/${blog.slug}`);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    // TODO: Implement edit functionality
    console.log('Edit blog:', blog);
  };

  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <LoadingSkeleton />
        </div>
      </div>
    );
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBlogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="bg-card p-6 rounded-lg border">
        {/* Primary Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Zoek in verhalen..." 
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
              <SelectItem value="views">Meest bekeken</SelectItem>
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
              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
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
              <Select value={filters.albumType} onValueChange={(value) => updateFilter('albumType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Album Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
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
                  updateFilter('status', 'published');
                  updateFilter('sortBy', 'views');
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Populair
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  updateFilter('dateRange', 'week');
                  updateFilter('sortBy', 'date');
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
                  updateFilter('sortBy', 'date');
                }}
              >
                <Clock className="w-3 h-3 mr-1" />
                Concepten
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
            {filteredBlogs.length} {filteredBlogs.length === 1 ? 'verhaal' : 'verhalen'}
          </div>
        </div>
      </div>

      {/* Content */}
      {blogs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Nog geen verhalen</h3>
              <p className="text-muted-foreground mb-4">
                Er zijn nog geen Plaat & Verhaal artikelen gegenereerd. 
                Genereer verhalen door op de "Plaat & Verhaal" knop te klikken bij je albums.
              </p>
            </div>
          </div>
        </Card>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen verhalen gevonden</h3>
          <p className="text-muted-foreground mb-4">
            {debouncedSearch || activeFilterCount > 0 
              ? 'Geen verhalen gevonden die voldoen aan je criteria.'
              : 'Er zijn geen verhalen beschikbaar.'
            }
          </p>
          {(debouncedSearch || activeFilterCount > 0) && (
            <Button variant="outline" onClick={resetFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Reset alle filters
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${filters.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredBlogs.map((blog) => (
            <PlaatVerhaalBlogCard
              key={blog.id}
              blog={blog}
              onView={handleView}
              onEdit={handleEdit}
              viewMode={filters.viewMode as 'grid' | 'list'}
              searchTerm={debouncedSearch}
            />
          ))}
        </div>
      )}

      {/* Tips */}
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