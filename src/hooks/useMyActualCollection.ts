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
  artwork_url?: string | null;
  
  // Collection item fields (may not exist for incomplete scans)
  calculated_advice_price?: number | null;
  lowest_price?: number | null;
  median_price?: number | null;
  highest_price?: number | null;
  is_public?: boolean | null;
  is_for_sale?: boolean | null;
  release_id?: string | null;
  
  // For tracking which table this came from
  source_table: 'ai_scan_results' | 'cd_scan' | 'vinyl2_scan';
}

export interface CollectionStats {
  totalCount: number;
  aiScans: number;
  physicalCD: number;
  physicalVinyl: number;
  physicalTotal: number;
  withValue: number;
  readyForShop: number;
  public: number;
  forSale: number;
  totalValue: number;
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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Build base query filters (shared between data and stats)
      const buildBaseQuery = (query: any) => {
        query = query.eq('user_id', user.id);
        query = query.or(`source_table.eq.cd_scan,source_table.eq.vinyl2_scan,source_table.eq.ai_scan_results`);
        
        if (searchTerm) {
          query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%,catalog_number.ilike.%${searchTerm}%`);
        }
        
        if (mediaTypeFilter && mediaTypeFilter !== 'all') {
          query = query.eq('media_type', mediaTypeFilter);
        }
        
        return query;
      };

      // Build data query with all filters including status
      let dataQuery = supabase
        .from('unified_scans')
        .select('*', { count: 'exact' });

      dataQuery = buildBaseQuery(dataQuery);

      // Apply status filter for data
      if (statusFilter && statusFilter !== 'all') {
        switch (statusFilter) {
          case 'met_waarde':
            dataQuery = dataQuery.not('calculated_advice_price', 'is', null);
            break;
          case 'zonder_waarde':
            dataQuery = dataQuery.is('calculated_advice_price', null);
            break;
          case 'ready_for_shop':
            dataQuery = dataQuery.eq('is_for_sale', false).not('calculated_advice_price', 'is', null);
            break;
          case 'for_sale':
            dataQuery = dataQuery.eq('is_for_sale', true);
            break;
          case 'public':
            dataQuery = dataQuery.eq('is_public', true);
            break;
          case 'private':
            dataQuery = dataQuery.eq('is_public', false);
            break;
          case 'cd_scan':
          case 'vinyl2_scan':
          case 'ai_scan_results':
            dataQuery = dataQuery.eq('source_table', statusFilter);
            break;
        }
      }

      // Apply sorting and pagination
      dataQuery = dataQuery.order(sortField, { ascending: sortDirection === 'asc' });
      dataQuery = dataQuery.range(offset, offset + pageSize - 1);

      let stats: CollectionStats | null = null;

      // Fetch stats only on first page
      if (pageParam === 0) {
        const [
          totalResult,
          aiResult,
          cdResult,
          vinylResult,
          withValueResult,
          readyForShopResult,
          publicResult,
          forSaleResult,
          totalValueResult
        ] = await Promise.all([
          // Total count
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })),
          // AI scans
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('source_table', 'ai_scan_results'),
          // CD scans
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('source_table', 'cd_scan'),
          // Vinyl scans
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('source_table', 'vinyl2_scan'),
          // With value
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).not('calculated_advice_price', 'is', null),
          // Ready for shop
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('is_for_sale', false).not('calculated_advice_price', 'is', null),
          // Public
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('is_public', true),
          // For sale
          buildBaseQuery(supabase.from('unified_scans').select('*', { count: 'exact', head: true })).eq('is_for_sale', true),
          // Total value
          buildBaseQuery(supabase.from('unified_scans').select('calculated_advice_price')).not('calculated_advice_price', 'is', null).gt('calculated_advice_price', 0)
        ]);

        const totalValue = totalValueResult.data?.reduce((sum, item) => sum + (item.calculated_advice_price || 0), 0) || 0;

        stats = {
          totalCount: totalResult.count || 0,
          aiScans: aiResult.count || 0,
          physicalCD: cdResult.count || 0,
          physicalVinyl: vinylResult.count || 0,
          physicalTotal: (cdResult.count || 0) + (vinylResult.count || 0),
          withValue: withValueResult.count || 0,
          readyForShop: readyForShopResult.count || 0,
          public: publicResult.count || 0,
          forSale: forSaleResult.count || 0,
          totalValue: totalValue
        };
      }

      const { data, error, count } = await dataQuery;

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
        totalCount,
        stats
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // Cache data for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute after unmount
    refetchOnWindowFocus: false, // Prevent refetching on window focus
  });
}