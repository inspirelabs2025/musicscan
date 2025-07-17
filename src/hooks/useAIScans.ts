import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type AIScanResult = Tables<"ai_scan_results">;

interface UseAIScansOptions {
  page?: number;
  pageSize?: number;
  sortField?: keyof AIScanResult;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
  mediaTypeFilter?: string;
  statusFilter?: string;
}

export const useAIScans = (options: UseAIScansOptions = {}) => {
  const {
    page = 1,
    pageSize = 50,
    sortField = "created_at",
    sortDirection = "desc",
    searchTerm = "",
    mediaTypeFilter = "",
    statusFilter = ""
  } = options;

  return useQuery({
    queryKey: ["ai-scans", page, pageSize, sortField, sortDirection, searchTerm, mediaTypeFilter, statusFilter],
    queryFn: async () => {
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
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }
  });
};

// Hook for AI scan statistics
export const useAIScansStats = () => {
  return useQuery({
    queryKey: ["ai-scans-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_scan_results")
        .select("*");

      if (error) throw error;

      const totalScans = data.length;
      const completedScans = data.filter(scan => scan.status === "completed").length;
      const failedScans = data.filter(scan => scan.status === "failed").length;
      const pendingScans = data.filter(scan => scan.status === "pending").length;

      const completedWithConfidence = data.filter(scan => 
        scan.status === "completed" && scan.confidence_score !== null
      );
      const avgConfidence = completedWithConfidence.length > 0 
        ? completedWithConfidence.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0) / completedWithConfidence.length
        : 0;

      const mediaTypeBreakdown = {
        vinyl: data.filter(scan => scan.media_type === "vinyl").length,
        cd: data.filter(scan => scan.media_type === "cd").length
      };

      const topArtists = data
        .filter(scan => scan.artist)
        .reduce((acc, scan) => {
          const artist = scan.artist!;
          acc[artist] = (acc[artist] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topArtistsList = Object.entries(topArtists)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([artist, count]) => ({ artist, count }));

      return {
        totalScans,
        completedScans,
        failedScans,
        pendingScans,
        successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
        avgConfidence,
        mediaTypeBreakdown,
        topArtists: topArtistsList
      };
    }
  });
};