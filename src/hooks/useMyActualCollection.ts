import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the collection item interface for actual collection items only
export interface CollectionItem {
  id: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  photo_urls: string[];
  media_type: string;
  condition_grade: string | null;
  artist: string | null;
  title: string | null;
  label: string | null;
  catalog_number: string | null;
  discogs_id: number | null;
  discogs_url: string | null;
  confidence_score: number | null;
  status: string;
  error_message: string | null;
  ai_description: string | null;
  search_queries: string[] | null;
  genre: string | null;
  country: string | null;
  format: string | null;
  style: string[] | null;
  barcode: string | null;
  matrix_number: string | null;
  comments: string | null;
  year: number | null;
  is_flagged_incorrect?: boolean;
  
  // Collection item fields (these are guaranteed to exist)
  calculated_advice_price: number;
  lowest_price?: number | null;
  median_price?: number | null;
  highest_price?: number | null;
  is_public?: boolean | null;
  is_for_sale?: boolean | null;
  release_id?: string | null;
  
  // For tracking which table this came from
  source_table: 'ai_scan_results' | 'cd_scan' | 'vinyl2_scan';
}

export interface UseMyActualCollectionOptions {
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  mediaTypeFilter?: string;
  statusFilter?: string;
}

export function useMyActualCollection(options: UseMyActualCollectionOptions = {}) {
  const {
    pageSize = 50,
    sortField = 'created_at',
    sortDirection = 'desc',
    searchTerm,
    mediaTypeFilter,
    statusFilter,
  } = options;

  return useInfiniteQuery({
    queryKey: ['myActualCollection', { 
      pageSize, 
      sortField, 
      sortDirection, 
      searchTerm, 
      mediaTypeFilter, 
      statusFilter 
    }],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching actual collection items with pageParam:', pageParam);
      
      const offset = pageParam * pageSize;
      
      // Build the query using the unified view but filter for actual collection items only
      let query = supabase
        .from('unified_scans')
        .select('*', { count: 'exact' });

      // Apply user filter - get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = query.eq('user_id', user.id);
      }

      // CRITICAL: Only show items that are truly part of the collection
      // 1. Must have calculated_advice_price (have value)
      // 2. Either physical items (cd_scan, vinyl2_scan) OR completed AI scans that have been added to collection
      query = query.not('calculated_advice_price', 'is', null);
      
      // Filter for actual collection items:
      // - Physical items (cd_scan, vinyl2_scan) with pricing
      // - AI scans that are completed and have been processed with pricing
      query = query.or(`source_table.eq.cd_scan,source_table.eq.vinyl2_scan,and(source_table.eq.ai_scan_results,status.eq.completed)`);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%,catalog_number.ilike.%${searchTerm}%`);
      }

      // Apply media type filter
      if (mediaTypeFilter && mediaTypeFilter !== 'all') {
        query = query.eq('media_type', mediaTypeFilter);
      }

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        switch (statusFilter) {
          case 'ready_for_shop':
            // Items with pricing but not for sale (collection items only)
            query = query.eq('is_for_sale', false);
            break;
          case 'for_sale':
            query = query.eq('is_for_sale', true);
            break;
          case 'public':
            query = query.eq('is_public', true);
            break;
          case 'private':
            query = query.eq('is_public', false);
            break;
          case 'cd_scan':
          case 'vinyl2_scan':
          case 'ai_scan_results':
            query = query.eq('source_table', statusFilter);
            break;
        }
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching actual collection:', error);
        throw error;
      }

      const totalCount = count || 0;
      const items = data || [];
      
      console.log(`Fetched ${items.length} collection items for page ${pageParam}, total: ${totalCount}`);
      
      return {
        data: items as CollectionItem[],
        nextCursor: items.length === pageSize ? pageParam + 1 : undefined,
        hasNextPage: items.length === pageSize && (offset + pageSize) < totalCount,
        totalCount
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // Cache data for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute after unmount
    refetchOnWindowFocus: false, // Prevent refetching on window focus
  });
}