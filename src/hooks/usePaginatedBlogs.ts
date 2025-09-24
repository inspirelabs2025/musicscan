import { useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BlogPostListItem {
  id: string;
  album_id: string;
  album_type: string;
  slug: string;
  yaml_frontmatter: any;
  social_post: string | null;
  published_at: string | null;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  album_cover_url: string | null;
}

interface BlogFilters {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  albumType?: string;
  dateRange?: 'week' | 'month' | 'year' | 'all';
  sortBy?: 'created_at' | 'views_count' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 24;

export const usePaginatedBlogs = (filters: BlogFilters = {}) => {
  const { user } = useAuth();
  const [hasManuallyFetched, setHasManuallyFetched] = useState(false);

  const fetchBlogs = async ({ pageParam = 0 }) => {
    let query = supabase
      .from("blog_posts")
      .select(`
        id,
        album_id,
        album_type,
        slug,
        yaml_frontmatter,
        social_post,
        published_at,
        is_published,
        views_count,
        created_at,
        updated_at,
        album_cover_url
      `)
      .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

    // Note: No user filter applied - show all published blogs to everyone

    // Apply status filter
    if (filters.status === 'published') {
      query = query.eq("is_published", true);
    } else if (filters.status === 'draft') {
      query = query.eq("is_published", false);
    }

    // Apply album type filter
    if (filters.albumType && filters.albumType !== 'all') {
      query = query.eq("album_type", filters.albumType);
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date;
      
      switch (filters.dateRange) {
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(0);
      }
      
      query = query.gte("created_at", dateFrom.toISOString());
    }

    // Apply search filter - server-side text search
    if (filters.search) {
      query = query.or(`
        yaml_frontmatter->>title.ilike.%${filters.search}%,
        yaml_frontmatter->>artist.ilike.%${filters.search}%,
        yaml_frontmatter->>album.ilike.%${filters.search}%,
        yaml_frontmatter->>genre.ilike.%${filters.search}%
      `);
    }

    // Apply sorting
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    
    if (sortField === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortField === 'views_count') {
      query = query.order('views_count', { ascending: sortOrder === 'asc' });
    } else if (sortField === 'updated_at') {
      query = query.order('updated_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }

    return {
      blogs: data as BlogPostListItem[],
      nextPage: (data?.length === ITEMS_PER_PAGE) ? pageParam + 1 : undefined,
      totalCount: count
    };
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["paginated-blogs", user?.id, filters],
    queryFn: fetchBlogs,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user || hasManuallyFetched,
  });

  const blogs = data?.pages.flatMap(page => page.blogs) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const refetchBlogs = useCallback(async () => {
    setHasManuallyFetched(true);
    return await refetch();
  }, [refetch]);

  return {
    blogs,
    totalCount,
    error,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchBlogs,
  };
};