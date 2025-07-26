import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReleaseItem {
  id: string;
  discogs_id: number;
  artist: string;
  title: string;
  label?: string;
  catalog_number?: string;
  year?: number;
  format?: string;
  genre?: string;
  country?: string;
  style?: string[];
  discogs_url?: string;
  master_id?: number;
  total_scans: number;
  price_range_min?: number;
  price_range_max?: number;
  condition_counts?: Record<string, any>;
  created_at: string;
  updated_at: string;
  first_scan_date?: string;
  last_scan_date?: string;
}

export interface ReleaseScan {
  id: string;
  media_type: "cd" | "vinyl";
  user_id: string;
  condition_grade?: string;
  marketplace_price?: number;
  calculated_advice_price?: number;
  is_public: boolean;
  is_for_sale: boolean;
  created_at: string;
  // Images
  front_image?: string;
  back_image?: string;
  barcode_image?: string;
  matrix_image?: string;
  catalog_image?: string;
  additional_image?: string;
  // Technical details
  barcode_number?: string;
  matrix_number?: string;
  side?: string;
  stamper_codes?: string;
  marketplace_location?: string;
  marketplace_allow_offers?: boolean;
  marketplace_weight?: number;
  shop_description?: string;
}

export const useReleaseDetail = (releaseId: string) => {
  const { data: release, isLoading: isLoadingRelease, error: releaseError } = useQuery({
    queryKey: ["release-detail", releaseId],
    queryFn: async () => {
      if (!releaseId) return null;

      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("id", releaseId)
        .maybeSingle();

      if (error) throw error;
      return data as ReleaseItem;
    },
    enabled: !!releaseId,
  });

  const { data: scans = [], isLoading: isLoadingScans } = useQuery({
    queryKey: ["release-scans", releaseId],
    queryFn: async () => {
      if (!releaseId) return [];

      // Fetch scans from both tables
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, user_id, condition_grade, marketplace_price, calculated_advice_price,
            is_public, is_for_sale, created_at, front_image, back_image, barcode_image,
            matrix_image, barcode_number, matrix_number, side, stamper_codes,
            marketplace_location, marketplace_allow_offers, marketplace_weight,
            shop_description
          `)
          .eq("release_id", releaseId),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, user_id, condition_grade, marketplace_price, calculated_advice_price,
            is_public, is_for_sale, created_at, catalog_image, matrix_image,
            additional_image, matrix_number, marketplace_location, marketplace_allow_offers,
            marketplace_weight, shop_description
          `)
          .eq("release_id", releaseId)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;

      const cdScans: ReleaseScan[] = (cdResults.data || []).map(scan => ({
        ...scan,
        media_type: "cd" as const,
      }));

      const vinylScans: ReleaseScan[] = (vinylResults.data || []).map(scan => ({
        ...scan,
        media_type: "vinyl" as const,
      }));

      return [...cdScans, ...vinylScans];
    },
    enabled: !!releaseId,
  });

  return {
    release,
    scans,
    isLoading: isLoadingRelease || isLoadingScans,
    error: releaseError,
  };
};