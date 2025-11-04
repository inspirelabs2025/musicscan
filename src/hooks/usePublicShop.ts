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
      const [cdResults, vinylResults, platformResults] = await Promise.all([
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
          .eq("is_public", true),
        supabase
          .from("platform_products")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            description, condition_grade, price, currency, created_at, images, 
            primary_image, media_type, slug
          `)
          .eq("created_by", shop.user_id)
          .eq("status", "active")
          .not("published_at", "is", null)
          .gt("stock_quantity", 0)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;
      if (platformResults.error) throw platformResults.error;

      // Combine and format results
      const cdItems: CollectionItem[] = (cdResults.data || []).map(item => ({
        ...item,
        media_type: "cd" as const
      }));

      const vinylItems: CollectionItem[] = (vinylResults.data || []).map(item => ({
        ...item,
        media_type: "vinyl" as const
      }));

      // Convert platform products to CollectionItem format
      const artItems: CollectionItem[] = (platformResults.data || []).map(item => ({
        id: item.id,
        artist: item.artist,
        title: item.title,
        label: item.label,
        catalog_number: item.catalog_number,
        year: item.year,
        discogs_id: item.discogs_id,
        discogs_url: item.discogs_url,
        is_public: true,
        is_for_sale: true,
        shop_description: item.description,
        condition_grade: item.condition_grade,
        marketplace_price: item.price,
        currency: item.currency,
        created_at: item.created_at,
        front_image: item.primary_image,
        back_image: item.images?.[1] || null,
        barcode_image: null,
        matrix_image: null,
        catalog_image: item.primary_image,
        additional_image: item.images?.[1] || null,
        calculated_advice_price: item.price,
        lowest_price: null,
        median_price: null,
        highest_price: null,
        media_type: item.media_type as any
      }));

      return [...cdItems, ...vinylItems, ...artItems];
    },
    enabled: !!shop?.user_id,
  });

  return {
    shop,
    items,
    isLoading: isShopLoading || isItemsLoading,
  };
};