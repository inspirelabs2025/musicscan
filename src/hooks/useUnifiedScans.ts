import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UnifiedScanResult {
  id: string;
  source_table: "ai_scan_results" | "cd_scan" | "vinyl2_scan";
  media_type: "cd" | "vinyl";
  artist: string | null;
  title: string | null;
  label: string | null;
  catalog_number: string | null;
  year: number | null;
  discogs_id: number | null;
  discogs_url: string | null;
  condition_grade: string | null;
  confidence_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  photo_urls: string[];
  ai_description: string | null;
  error_message: string | null;
  genre: string | null;
  country: string | null;
  format: string | null;
  style: string[] | null;
  barcode: string | null;
  matrix_number: string | null;
  comments: string | null;
  is_flagged_incorrect: boolean;
  // Pricing fields
  calculated_advice_price: number | null;
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  // Collection specific fields
  is_public: boolean | null;
  is_for_sale: boolean | null;
  shop_description: string | null;
  marketplace_price: number | null;
  currency: string | null;
}

interface UseUnifiedScansOptions {
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
  mediaTypeFilter?: string;
  statusFilter?: string;
}

export const useUnifiedScans = (options: UseUnifiedScansOptions = {}) => {
  const {
    pageSize = 50,
    sortField = "created_at",
    sortDirection = "desc",
    searchTerm = "",
    mediaTypeFilter = "",
    statusFilter = ""
  } = options;

  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["unified-scans", user?.id, pageSize, sortField, sortDirection, searchTerm, mediaTypeFilter, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const offset = pageParam * pageSize;
      
      // Fetch from all tables in parallel
      const queries = [];

      // AI Scan Results
      let aiQuery = supabase
        .from("ai_scan_results")
        .select(`
          id, media_type, artist, title, label, catalog_number, year, discogs_id,
          discogs_url, condition_grade, confidence_score, status, created_at, updated_at,
          user_id, photo_urls, ai_description, error_message, genre, country, format,
          style, barcode, matrix_number, comments, is_flagged_incorrect
        `)
        .eq("user_id", user.id);

      if (searchTerm) {
        aiQuery = aiQuery.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
      }
      if (mediaTypeFilter && mediaTypeFilter !== "all") {
        aiQuery = aiQuery.eq("media_type", mediaTypeFilter);
      }
      if (statusFilter && statusFilter !== "all") {
        aiQuery = aiQuery.eq("status", statusFilter);
      }

      // CD Scan
      let cdQuery = supabase
        .from("cd_scan")
        .select(`
          id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
          condition_grade, created_at, updated_at, user_id, genre, country, format,
          style, matrix_number, calculated_advice_price, lowest_price, median_price,
          highest_price, is_public, is_for_sale, shop_description, marketplace_price,
          currency, front_image, back_image, barcode_image, matrix_image
        `)
        .eq("user_id", user.id);

      if (searchTerm) {
        cdQuery = cdQuery.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
      }

      // Vinyl2 Scan
      let vinylQuery = supabase
        .from("vinyl2_scan")
        .select(`
          id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
          condition_grade, created_at, updated_at, user_id, genre, country, format,
          style, matrix_number, calculated_advice_price, lowest_price, median_price,
          highest_price, is_public, is_for_sale, shop_description, marketplace_price,
          currency, catalog_image, matrix_image, additional_image
        `)
        .eq("user_id", user.id);

      if (searchTerm) {
        vinylQuery = vinylQuery.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
      }

      // Execute queries based on media type filter
      if (mediaTypeFilter === "cd") {
        queries.push(aiQuery.then(result => ({ ...result, source: "ai_scan_results" })));
        queries.push(cdQuery.then(result => ({ ...result, source: "cd_scan" })));
      } else if (mediaTypeFilter === "vinyl") {
        queries.push(aiQuery.then(result => ({ ...result, source: "ai_scan_results" })));
        queries.push(vinylQuery.then(result => ({ ...result, source: "vinyl2_scan" })));
      } else {
        queries.push(aiQuery.then(result => ({ ...result, source: "ai_scan_results" })));
        queries.push(cdQuery.then(result => ({ ...result, source: "cd_scan" })));
        queries.push(vinylQuery.then(result => ({ ...result, source: "vinyl2_scan" })));
      }

      const results = await Promise.all(queries);
      
      // Normalize and combine all results
      const allItems: UnifiedScanResult[] = [];

      results.forEach(result => {
        if (result.error) throw result.error;
        
        (result.data || []).forEach((item: any) => {
          const source = result.source as "ai_scan_results" | "cd_scan" | "vinyl2_scan";
          
          // Build photo_urls array based on source
          let photo_urls: string[] = [];
          if (source === "ai_scan_results") {
            photo_urls = item.photo_urls || [];
          } else if (source === "cd_scan") {
            photo_urls = [item.front_image, item.back_image, item.barcode_image, item.matrix_image]
              .filter(Boolean);
          } else if (source === "vinyl2_scan") {
            photo_urls = [item.catalog_image, item.matrix_image, item.additional_image]
              .filter(Boolean);
          }

          // Normalize status based on source
          let status = "completed";
          if (source === "ai_scan_results") {
            status = item.status || "completed";
          } else {
            // Collection items are considered "completed"
            status = "completed";
          }

          // Determine media_type
          let media_type: "cd" | "vinyl" = "cd";
          if (source === "ai_scan_results") {
            media_type = item.media_type;
          } else if (source === "vinyl2_scan") {
            media_type = "vinyl";
          }

          const normalizedItem: UnifiedScanResult = {
            id: item.id,
            source_table: source,
            media_type,
            artist: item.artist,
            title: item.title,
            label: item.label,
            catalog_number: item.catalog_number,
            year: item.year,
            discogs_id: item.discogs_id,
            discogs_url: item.discogs_url,
            condition_grade: item.condition_grade,
            confidence_score: source === "ai_scan_results" ? item.confidence_score : null,
            status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            user_id: item.user_id,
            photo_urls,
            ai_description: item.ai_description || null,
            error_message: item.error_message || null,
            genre: item.genre,
            country: item.country,
            format: item.format,
            style: item.style,
            barcode: item.barcode || null,
            matrix_number: item.matrix_number,
            comments: item.comments || null,
            is_flagged_incorrect: item.is_flagged_incorrect || false,
            // Pricing fields
            calculated_advice_price: item.calculated_advice_price,
            lowest_price: item.lowest_price,
            median_price: item.median_price,
            highest_price: item.highest_price,
            // Collection specific fields
            is_public: source !== "ai_scan_results" ? item.is_public : null,
            is_for_sale: source !== "ai_scan_results" ? item.is_for_sale : null,
            shop_description: source !== "ai_scan_results" ? item.shop_description : null,
            marketplace_price: source !== "ai_scan_results" ? item.marketplace_price : null,
            currency: source !== "ai_scan_results" ? item.currency : null,
          };

          allItems.push(normalizedItem);
        });
      });

      // Sort all items
      allItems.sort((a, b) => {
        const aValue = a[sortField as keyof UnifiedScanResult];
        const bValue = b[sortField as keyof UnifiedScanResult];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === "asc" ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });

      // Apply pagination
      const paginatedItems = allItems.slice(offset, offset + pageSize);

      return {
        data: paginatedItems,
        totalItems: allItems.length,
        hasNextPage: offset + pageSize < allItems.length,
        nextCursor: offset + pageSize < allItems.length ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!user?.id,
  });
};

// Hook for unified scan statistics
export const useUnifiedScansStats = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["unified-scans-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const [aiResults, cdResults, vinylResults] = await Promise.all([
        supabase.from("ai_scan_results").select("*").eq("user_id", user.id),
        supabase.from("cd_scan").select("*").eq("user_id", user.id),
        supabase.from("vinyl2_scan").select("*").eq("user_id", user.id)
      ]);

      if (aiResults.error) throw aiResults.error;
      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      const aiScans = aiResults.data || [];
      const cdScans = cdResults.data || [];
      const vinylScans = vinylResults.data || [];

      const totalScans = aiScans.length + cdScans.length + vinylScans.length;
      const completedScans = aiScans.filter(scan => scan.status === "completed").length + cdScans.length + vinylScans.length;
      const failedScans = aiScans.filter(scan => scan.status === "failed").length;
      const pendingScans = aiScans.filter(scan => scan.status === "pending").length;

      const mediaTypeBreakdown = {
        vinyl: aiScans.filter(scan => scan.media_type === "vinyl").length + vinylScans.length,
        cd: aiScans.filter(scan => scan.media_type === "cd").length + cdScans.length
      };

      const v2Scans = aiScans.length;
      const collectionItems = cdScans.length + vinylScans.length;

      return {
        totalScans,
        completedScans,
        failedScans,
        pendingScans,
        successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
        mediaTypeBreakdown,
        v2Scans,
        collectionItems
      };
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    enabled: !!user?.id,
  });
};