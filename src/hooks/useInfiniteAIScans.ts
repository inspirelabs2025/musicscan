import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type AIScanResult = Tables<"ai_scan_results">;

interface UseInfiniteAIScansOptions {
  pageSize?: number;
  sortField?: keyof AIScanResult;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
  mediaTypeFilter?: string;
  statusFilter?: string;
}

export const useInfiniteAIScans = (options: UseInfiniteAIScansOptions = {}) => {
  const {
    pageSize = 25,
    sortField = "created_at",
    sortDirection = "desc",
    searchTerm = "",
    mediaTypeFilter = "",
    statusFilter = ""
  } = options;

  return useInfiniteQuery({
    queryKey: ["ai-scans-infinite", pageSize, sortField, sortDirection, searchTerm, mediaTypeFilter, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("ai_scan_results")
        .select("*", { count: "exact" });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
      }

      // Apply media type filter
      if (mediaTypeFilter && mediaTypeFilter !== "all") {
        query = query.eq("media_type", mediaTypeFilter);
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      // Apply pagination
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        nextPage: data && data.length === pageSize ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};