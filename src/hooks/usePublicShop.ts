import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

interface UserShop {
  id: string;
  user_id: string;
  shop_name: string | null;
  shop_description: string | null;
  is_public: boolean;
  contact_info: string | null;
  shop_url_slug: string | null;
  view_count: number;
}

export const usePublicShop = (shopSlug: string) => {
  const { data: shop, isLoading: isShopLoading } = useQuery({
    queryKey: ["public-shop", shopSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_shops")
        .select("*")
        .eq("shop_url_slug", shopSlug)
        .eq("is_public", true)
        .single();

      if (error) throw error;
      return data as UserShop;
    },
    enabled: !!shopSlug,
  });

  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ["public-shop-items", shop?.user_id],
    queryFn: async () => {
      if (!shop?.user_id) return [];

      // Fetch items that are both for sale AND public
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, back_image, 
            barcode_image, matrix_image, calculated_advice_price, lowest_price,
            median_price, highest_price
          `)
          .eq("user_id", shop.user_id)
          .eq("is_for_sale", true)
          .eq("is_public", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, matrix_image, 
            additional_image, calculated_advice_price, lowest_price, median_price,
            highest_price
          `)
          .eq("user_id", shop.user_id)
          .eq("is_for_sale", true)
          .eq("is_public", true)
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
    enabled: !!shop?.user_id,
  });

  return {
    shop,
    items,
    isLoading: isShopLoading || isItemsLoading,
  };
};