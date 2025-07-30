import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DirectScanItem = {
  id: string;
  artist: string | null;
  title: string | null;
  created_at: string;
  media_type: 'cd' | 'vinyl' | 'ai';
  front_image?: string | null;
  catalog_image?: string | null;
  user_id: string;
};

export const useDirectScans = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["direct-scans-v2", user?.id],
    queryFn: async (): Promise<DirectScanItem[]> => {
      const userId = user?.id;

      // Build queries with optional user filtering
      const cdQuery = supabase
        .from("cd_scan")
        .select("id, artist, title, created_at, front_image, user_id")
        .limit(10000);
      
      const vinylQuery = supabase
        .from("vinyl2_scan")
        .select("id, artist, title, created_at, catalog_image, user_id")
        .limit(10000);
      
      const aiQuery = supabase
        .from("ai_scan_results")
        .select("id, artist, title, created_at, user_id")
        .limit(10000);

      // Apply user filter only if user is logged in
      if (userId) {
        cdQuery.eq("user_id", userId);
        vinylQuery.eq("user_id", userId);
        aiQuery.eq("user_id", userId);
      }

      const [cdResults, vinylResults, aiResults] = await Promise.all([
        cdQuery,
        vinylQuery,
        aiQuery
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;
      if (aiResults.error) throw aiResults.error;

      // Debug logging
      console.log("Direct scans debug:");
      console.log("CD results:", cdResults.data?.length || 0);
      console.log("Vinyl results:", vinylResults.data?.length || 0);
      console.log("AI results:", aiResults.data?.length || 0);

      // Transform and combine results
      const cdItems: DirectScanItem[] = (cdResults.data || []).map(item => ({
        id: item.id,
        artist: item.artist,
        title: item.title,
        created_at: item.created_at,
        media_type: 'cd' as const,
        front_image: item.front_image,
        user_id: item.user_id,
      }));

      const vinylItems: DirectScanItem[] = (vinylResults.data || []).map(item => ({
        id: item.id,
        artist: item.artist,
        title: item.title,
        created_at: item.created_at,
        media_type: 'vinyl' as const,
        catalog_image: item.catalog_image,
        user_id: item.user_id,
      }));

      const aiItems: DirectScanItem[] = (aiResults.data || []).map(item => ({
        id: item.id,
        artist: item.artist,
        title: item.title,
        created_at: item.created_at,
        media_type: 'ai' as const,
        user_id: item.user_id,
      }));

      // Combine and sort by created_at
      const allItems = [...cdItems, ...vinylItems, ...aiItems];
      console.log("Total combined items:", allItems.length);
      
      const sortedItems = allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      console.log("After sorting:", sortedItems.length);
      
      return sortedItems;
    },
  });
};