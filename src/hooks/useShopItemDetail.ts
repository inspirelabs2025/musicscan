import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

interface ShopItemDetail extends CollectionItem {
  shop_name: string | null;
  shop_description: string | null;
  shop_contact_info: string | null;
  shop_url_slug: string | null;
}

export const useShopItemDetail = (shopSlug: string, itemId: string) => {
  return useQuery({
    queryKey: ["shop-item-detail", shopSlug, itemId],
    queryFn: async () => {
      if (!shopSlug || !itemId) return null;

      // First get the shop info
      const { data: shop, error: shopError } = await supabase
        .from("user_shops")
        .select("*")
        .eq("shop_url_slug", shopSlug)
        .eq("is_public", true)
        .single();

      if (shopError || !shop) throw new Error("Shop not found");

      // Then get the item from both CD and vinyl tables
      const [cdResult, vinylResult] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, back_image, 
            barcode_image, matrix_image, calculated_advice_price, lowest_price,
            median_price, highest_price
          `)
          .eq("id", itemId)
          .eq("user_id", shop.user_id)
          .eq("is_for_sale", true)
          .eq("is_public", true)
          .maybeSingle(),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, matrix_image, 
            additional_image, calculated_advice_price, lowest_price, median_price,
            highest_price
          `)
          .eq("id", itemId)
          .eq("user_id", shop.user_id)
          .eq("is_for_sale", true)
          .eq("is_public", true)
          .maybeSingle()
      ]);

      if (cdResult.error && vinylResult.error) {
        throw new Error("Failed to fetch item");
      }

      let item: ShopItemDetail | null = null;

      if (cdResult.data) {
        item = {
          ...cdResult.data,
          media_type: "cd" as const,
          shop_name: shop.shop_name,
          shop_description: shop.shop_description,
          shop_contact_info: shop.contact_info,
          shop_url_slug: shop.shop_url_slug
        };
      } else if (vinylResult.data) {
        item = {
          ...vinylResult.data,
          media_type: "vinyl" as const,
          shop_name: shop.shop_name,
          shop_description: shop.shop_description,
          shop_contact_info: shop.contact_info,
          shop_url_slug: shop.shop_url_slug
        };
      }

      if (!item) {
        throw new Error("Item not found");
      }

      return { item, shop };
    },
    enabled: !!shopSlug && !!itemId,
  });
};