import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

export const usePublicCatalog = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["public-catalog"],
    queryFn: async () => {
      // Fetch all public items from both tables
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, user_id
          `)
          .eq("is_public", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, user_id
          `)
          .eq("is_public", true)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      // Combine and format results
      const cdItems: CollectionItem[] = (cdResults.data || []).map(item => ({
        ...item,
        media_type: "cd" as const,
        front_image: item.front_image || undefined,
      }));

      const vinylItems: CollectionItem[] = (vinylResults.data || []).map(item => ({
        ...item,
        media_type: "vinyl" as const,
        front_image: item.catalog_image || undefined,
      }));

      // Sort by creation date, newest first
      const allItems = [...cdItems, ...vinylItems];
      return allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  return {
    items,
    isLoading,
  };
};