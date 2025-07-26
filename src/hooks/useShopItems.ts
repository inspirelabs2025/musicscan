import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CollectionItem } from "./useMyCollection";

export const useShopItems = () => {
  const { user } = useAuth();

  const { data: shopItems = [], isLoading } = useQuery({
    queryKey: ["shop-items", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch only items that are for sale
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, back_image, 
            barcode_image, matrix_image
          `)
          .eq("user_id", user.id)
          .eq("is_for_sale", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, matrix_image, 
            additional_image
          `)
          .eq("user_id", user.id)
          .eq("is_for_sale", true)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      // Combine and format results
      const cdItems: CollectionItem[] = (cdResults.data || []).map(item => ({
        ...item,
        media_type: "cd" as const
      }));

      const vinylItems: CollectionItem[] = (vinylResults.data || []).map(item => ({
        ...item,
        media_type: "vinyl" as const
      }));

      return [...cdItems, ...vinylItems];
    },
    enabled: !!user?.id,
  });

  return {
    shopItems,
    isLoading,
  };
};