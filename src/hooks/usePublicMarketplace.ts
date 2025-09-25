import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

export interface MarketplaceItem extends CollectionItem {
  shop_name?: string;
  shop_slug?: string;
  shop_owner_name?: string;
  shop_contact_info?: string;
}

export const usePublicMarketplace = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["public-marketplace"],
    queryFn: async () => {
      // Fetch all items that are both public AND for sale
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, user_id
          `)
          .eq("is_public", true)
          .eq("is_for_sale", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, user_id
          `)
          .eq("is_public", true)
          .eq("is_for_sale", true)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      // Get unique user IDs to fetch shop and profile info
      const userIds = Array.from(new Set([
        ...(cdResults.data || []).map(item => item.user_id),
        ...(vinylResults.data || []).map(item => item.user_id)
      ]));

      // Fetch shop and profile information for all users
      const [shopsResult, profilesResult] = await Promise.all([
        supabase
          .from("user_shops")
          .select("user_id, shop_name, shop_url_slug, contact_info")
          .in("user_id", userIds),
        supabase
          .from("profiles")
          .select("user_id, first_name")
          .in("user_id", userIds)
      ]);

      // Create lookup maps
      const shopsMap = new Map(
        (shopsResult.data || []).map(shop => [shop.user_id, shop])
      );
      const profilesMap = new Map(
        (profilesResult.data || []).map(profile => [profile.user_id, profile])
      );

      // Combine and format results with shop information
      const cdItems: MarketplaceItem[] = (cdResults.data || []).map(item => {
        const shop = shopsMap.get(item.user_id);
        const profile = profilesMap.get(item.user_id);
        
        return {
          ...item,
          media_type: "cd" as const,
          front_image: item.front_image || undefined,
          shop_name: shop?.shop_name || undefined,
          shop_slug: shop?.shop_url_slug || undefined,
          shop_owner_name: profile?.first_name || undefined,
          shop_contact_info: shop?.contact_info || undefined,
        };
      });

      const vinylItems: MarketplaceItem[] = (vinylResults.data || []).map(item => {
        const shop = shopsMap.get(item.user_id);
        const profile = profilesMap.get(item.user_id);
        
        return {
          ...item,
          media_type: "vinyl" as const,
          front_image: item.catalog_image || undefined,
          shop_name: shop?.shop_name || undefined,
          shop_slug: shop?.shop_url_slug || undefined,
          shop_owner_name: profile?.first_name || undefined,
          shop_contact_info: shop?.contact_info || undefined,
        };
      });

      // Combine and sort by creation date, newest first
      const allItems = [...cdItems, ...vinylItems];
      return allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  return {
    items,
    isLoading,
  };
};