import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

export const usePublicCollection = (userId: string) => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["public-collection", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch only public items (not necessarily for sale)
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            currency, created_at, front_image
          `)
          .eq("user_id", userId)
          .eq("is_public", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            currency, created_at, catalog_image
          `)
          .eq("user_id", userId)
          .eq("is_public", true)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      // Combine and format results (without prices for collection view)
      const cdItems: CollectionItem[] = (cdResults.data || []).map(item => ({
        ...item,
        media_type: "cd" as const,
        marketplace_price: null, // Hide prices in collection view
      }));

      const vinylItems: CollectionItem[] = (vinylResults.data || []).map(item => ({
        ...item,
        media_type: "vinyl" as const,
        marketplace_price: null, // Hide prices in collection view
      }));

      return [...cdItems, ...vinylItems];
    },
    enabled: !!userId,
  });

  return {
    items,
    isLoading,
  };
};