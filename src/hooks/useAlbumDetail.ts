import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "./useMyCollection";

export const useAlbumDetail = (albumId: string) => {
  const { data: album, isLoading, error } = useQuery({
    queryKey: ["album-detail", albumId],
    queryFn: async () => {
      if (!albumId) return null;

      // Try to fetch from both cd_scan and vinyl2_scan tables
      const [cdResult, vinylResult] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            currency, created_at, updated_at, front_image, back_image, barcode_image, matrix_image,
            barcode_number, format, genre, country, marketplace_price, user_id,
            lowest_price, median_price, highest_price, calculated_advice_price,
            marketplace_allow_offers, marketplace_weight, marketplace_format_quantity,
            marketplace_status, marketplace_comments, marketplace_external_id,
            marketplace_location, marketplace_sleeve_condition, matrix_number, side,
            stamper_codes, style
          `)
          .eq("id", albumId)
          .single(),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            currency, created_at, updated_at, catalog_image, matrix_image, additional_image,
            format, genre, country, marketplace_price, user_id, matrix_number,
            lowest_price, median_price, highest_price, calculated_advice_price,
            marketplace_allow_offers, marketplace_weight, marketplace_format_quantity,
            marketplace_sleeve_condition, marketplace_status, marketplace_comments,
            marketplace_external_id, marketplace_location, style
          `)
          .eq("id", albumId)
          .single()
      ]);

      // Check which query succeeded
      let album: CollectionItem | null = null;
      
      if (cdResult.data && !cdResult.error) {
        album = {
          ...cdResult.data,
          media_type: "cd" as const,
          marketplace_price: cdResult.data.marketplace_price || null,
        };
      } else if (vinylResult.data && !vinylResult.error) {
        album = {
          ...vinylResult.data,
          media_type: "vinyl" as const,
          marketplace_price: vinylResult.data.marketplace_price || null,
        };
      }

      if (!album) {
        throw new Error("Album niet gevonden");
      }

      return album;
    },
    enabled: !!albumId,
  });

  return {
    album,
    isLoading,
    error,
  };
};