import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Unified scan result type that combines all scan tables
export interface UnifiedScanResult {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  photo_urls: string[];
  media_type: string;
  condition_grade: string;
  artist?: string | null;
  title?: string | null;
  label?: string | null;
  catalog_number?: string | null;
  discogs_id?: number | null;
  discogs_url?: string | null;
  confidence_score?: number | null;
  status: string;
  error_message?: string | null;
  ai_description?: string | null;
  search_queries?: string[] | null;
  genre?: string | null;
  country?: string | null;
  format?: string | null;
  style?: string[] | null;
  barcode?: string | null;
  matrix_number?: string | null;
  comments?: string | null;
  is_flagged_incorrect?: boolean;
  // Source table identifier
  source_table: 'ai_scan_results' | 'cd_scan' | 'vinyl2_scan';
  // Additional fields from cd_scan and vinyl2_scan
  year?: number | null;
  lowest_price?: number | null;
  median_price?: number | null;
  highest_price?: number | null;
  calculated_advice_price?: number | null;
}

interface UseInfiniteUnifiedScansOptions {
  pageSize?: number;
  sortField?: keyof UnifiedScanResult;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
  mediaTypeFilter?: string;
  statusFilter?: string;
}

// Store for all scans data to avoid refetching
let cachedAllScans: UnifiedScanResult[] | null = null;
let cacheKey: string | null = null;

export const useInfiniteUnifiedScans = (options: UseInfiniteUnifiedScansOptions = {}) => {
  const {
    pageSize = 25,
    sortField = "created_at",
    sortDirection = "desc",
    searchTerm = "",
    mediaTypeFilter = "",
    statusFilter = ""
  } = options;

  return useInfiniteQuery({
    queryKey: ["unified-scans-infinite", pageSize, sortField, sortDirection, searchTerm, mediaTypeFilter, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const currentCacheKey = `${sortField}-${sortDirection}-${searchTerm}-${mediaTypeFilter}-${statusFilter}`;
      
      // Only fetch data if it's the first page or cache is invalid
      if (pageParam === 0 || cacheKey !== currentCacheKey) {
        // Fetch data from all three tables
        const [aiScansResult, cdScansResult, vinylScansResult] = await Promise.all([
          fetchAIScans(searchTerm, mediaTypeFilter, statusFilter),
          fetchCDScans(searchTerm, mediaTypeFilter),
          fetchVinylScans(searchTerm, mediaTypeFilter)
        ]);

        // Debug logging
        console.log('🔍 useInfiniteUnifiedScans Data:', {
          aiScansCount: aiScansResult.length,
          cdScansCount: cdScansResult.length,
          vinylScansCount: vinylScansResult.length,
          totalScans: aiScansResult.length + cdScansResult.length + vinylScansResult.length,
          filters: { searchTerm, mediaTypeFilter, statusFilter }
        });

        // Combine and normalize all data
        const allScans: UnifiedScanResult[] = [
          ...aiScansResult.map(normalizeAIScanResult),
          ...cdScansResult.map(normalizeCDScanResult),
          ...vinylScansResult.map(normalizeVinylScanResult)
        ];

        // Apply sorting
        const sortedScans = sortScans(allScans, sortField, sortDirection);
        
        // Cache the sorted data
        cachedAllScans = sortedScans;
        cacheKey = currentCacheKey;
      }

      // Use cached data for pagination
      const totalCount = cachedAllScans?.length || 0;
      const from = pageParam * pageSize;
      const to = from + pageSize;
      const paginatedScans = cachedAllScans?.slice(from, to) || [];

      return {
        data: paginatedScans,
        nextPage: to < totalCount ? pageParam + 1 : undefined,
        totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

// Helper functions to fetch data from each table
async function fetchAIScans(searchTerm: string, mediaTypeFilter: string, statusFilter: string) {
  // Fetch AI scans with pagination to get all records (Supabase limit is 1000)
  const allAIScans = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    let query = supabase
      .from("ai_scan_results")
      .select("*")
      .range(offset, offset + pageSize - 1);

    if (searchTerm) {
      query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
    }

    if (mediaTypeFilter && mediaTypeFilter !== "all") {
      query = query.eq("media_type", mediaTypeFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (!data || data.length === 0) break;
    
    allAIScans.push(...data);
    
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  
  return allAIScans;
}

async function fetchCDScans(searchTerm: string, mediaTypeFilter: string) {
  if (mediaTypeFilter && mediaTypeFilter !== "all" && mediaTypeFilter !== "cd") {
    return [];
  }

  let query = supabase.from("cd_scan").select("*");

  if (searchTerm) {
    query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchVinylScans(searchTerm: string, mediaTypeFilter: string) {
  if (mediaTypeFilter && mediaTypeFilter !== "all" && mediaTypeFilter !== "vinyl") {
    return [];
  }

  let query = supabase.from("vinyl2_scan").select("*");

  if (searchTerm) {
    query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Normalization functions
function normalizeAIScanResult(scan: Tables<"ai_scan_results">): UnifiedScanResult {
  return {
    ...scan,
    source_table: 'ai_scan_results',
    media_type: scan.media_type,
    condition_grade: scan.condition_grade,
    photo_urls: scan.photo_urls || [],
    status: scan.status,
    year: scan.year,
    lowest_price: null,
    median_price: null,
    highest_price: null,
    calculated_advice_price: null,
  };
}

function normalizeCDScanResult(scan: Tables<"cd_scan">): UnifiedScanResult {
  // Map cd_scan fields to unified format
  const photoUrls: string[] = [];
  if (scan.front_image) photoUrls.push(scan.front_image);
  if (scan.back_image) photoUrls.push(scan.back_image);
  if (scan.barcode_image) photoUrls.push(scan.barcode_image);
  if (scan.matrix_image) photoUrls.push(scan.matrix_image);

  return {
    id: scan.id,
    created_at: scan.created_at,
    updated_at: scan.updated_at,
    user_id: scan.user_id,
    photo_urls: photoUrls,
    media_type: 'cd',
    condition_grade: scan.condition_grade || 'Unknown',
    artist: scan.artist,
    title: scan.title,
    label: scan.label,
    catalog_number: scan.catalog_number,
    discogs_id: scan.discogs_id,
    discogs_url: scan.discogs_url,
    confidence_score: null, // CD scans don't have confidence scores
    status: 'completed', // CD scans are considered completed
    error_message: null,
    ai_description: null,
    search_queries: null,
    genre: scan.genre,
    country: scan.country,
    format: scan.format,
    style: scan.style,
    barcode: scan.barcode_number,
    matrix_number: scan.matrix_number,
    comments: null,
    is_flagged_incorrect: false,
    source_table: 'cd_scan',
    year: scan.year,
    lowest_price: scan.lowest_price,
    median_price: scan.median_price,
    highest_price: scan.highest_price,
    calculated_advice_price: scan.calculated_advice_price,
  };
}

function normalizeVinylScanResult(scan: Tables<"vinyl2_scan">): UnifiedScanResult {
  // Map vinyl2_scan fields to unified format
  const photoUrls: string[] = [];
  if (scan.catalog_image) photoUrls.push(scan.catalog_image);
  if (scan.matrix_image) photoUrls.push(scan.matrix_image);
  if (scan.additional_image) photoUrls.push(scan.additional_image);

  return {
    id: scan.id,
    created_at: scan.created_at,
    updated_at: scan.updated_at,
    user_id: scan.user_id,
    photo_urls: photoUrls,
    media_type: 'vinyl',
    condition_grade: scan.condition_grade || 'Unknown',
    artist: scan.artist,
    title: scan.title,
    label: scan.label,
    catalog_number: scan.catalog_number,
    discogs_id: scan.discogs_id,
    discogs_url: scan.discogs_url,
    confidence_score: null, // Vinyl scans don't have confidence scores
    status: 'completed', // Vinyl scans are considered completed
    error_message: null,
    ai_description: null,
    search_queries: null,
    genre: scan.genre,
    country: scan.country,
    format: scan.format,
    style: scan.style,
    barcode: null,
    matrix_number: scan.matrix_number,
    comments: null,
    is_flagged_incorrect: false,
    source_table: 'vinyl2_scan',
    year: scan.year,
    lowest_price: scan.lowest_price,
    median_price: scan.median_price,
    highest_price: scan.highest_price,
    calculated_advice_price: scan.calculated_advice_price,
  };
}

// Helper function to sort unified scans
function sortScans(scans: UnifiedScanResult[], sortField: keyof UnifiedScanResult, sortDirection: "asc" | "desc"): UnifiedScanResult[] {
  return [...scans].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? 1 : -1;
    if (bValue == null) return sortDirection === "asc" ? -1 : 1;
    
    // Sort based on type
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const result = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? result : -result;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const result = aValue - bValue;
      return sortDirection === "asc" ? result : -result;
    }
    
    // For dates and other types, convert to string and compare
    const aStr = String(aValue);
    const bStr = String(bValue);
    const result = aStr.localeCompare(bStr);
    return sortDirection === "asc" ? result : -result;
  });
}