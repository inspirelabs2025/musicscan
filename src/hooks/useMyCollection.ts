import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CollectionItem {
  id: string;
  media_type: "cd" | "vinyl";
  artist: string | null;
  title: string | null;
  label: string | null;
  catalog_number: string | null;
  year: number | null;
  discogs_id: number | null;
  discogs_url: string | null;
  is_public: boolean;
  is_for_sale: boolean;
  shop_description: string | null;
  condition_grade: string | null;
  marketplace_price: number | null;
  currency: string | null;
  created_at: string;
  // Price fields
  calculated_advice_price?: number | null;
  lowest_price?: number | null;
  median_price?: number | null;
  highest_price?: number | null;
  // CD image fields
  front_image?: string | null;
  back_image?: string | null;
  barcode_image?: string | null;
  // Vinyl image fields  
  catalog_image?: string | null;
  matrix_image?: string | null;
  additional_image?: string | null;
}

type FilterType = "all" | "public" | "for_sale" | "private";

export const useMyCollection = (filter: FilterType = "all") => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-collection", user?.id, filter],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch from both tables
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
          .eq("user_id", user.id),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, matrix_image, 
            additional_image, calculated_advice_price, lowest_price, median_price,
            highest_price
          `)
          .eq("user_id", user.id)
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

      const allItems = [...cdItems, ...vinylItems];

      // Apply filter
      switch (filter) {
        case "public":
          return allItems.filter(item => item.is_public);
        case "for_sale":
          return allItems.filter(item => item.is_for_sale);
        case "private":
          return allItems.filter(item => !item.is_public && !item.is_for_sale);
        default:
          return allItems;
      }
    },
    enabled: !!user?.id,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ 
      id, 
      media_type, 
      updates 
    }: { 
      id: string; 
      media_type: "cd" | "vinyl"; 
      updates: Partial<Pick<CollectionItem, "is_public" | "is_for_sale" | "shop_description" | "marketplace_price">>
    }) => {
      const table = media_type === "cd" ? "cd_scan" : "vinyl2_scan";
      
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-collection", user?.id] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ 
      items, 
      updates 
    }: { 
      items: { id: string; media_type: "cd" | "vinyl" }[];
      updates: Partial<Pick<CollectionItem, "is_public" | "is_for_sale">>
    }) => {
      // Group by media type
      const cdItems = items.filter(item => item.media_type === "cd").map(item => item.id);
      const vinylItems = items.filter(item => item.media_type === "vinyl").map(item => item.id);

      const promises = [];

      if (cdItems.length > 0) {
        promises.push(
          supabase
            .from("cd_scan")
            .update(updates)
            .in("id", cdItems)
        );
      }

      if (vinylItems.length > 0) {
        promises.push(
          supabase
            .from("vinyl2_scan")
            .update(updates)
            .in("id", vinylItems)
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-collection", user?.id] });
    },
  });

  return {
    items,
    isLoading,
    updateItem: updateItemMutation.mutate,
    isUpdating: updateItemMutation.isPending,
    bulkUpdate: bulkUpdateMutation.mutate,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};