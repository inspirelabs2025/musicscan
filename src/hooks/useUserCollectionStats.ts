import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserCollectionStats {
  totalItems: number;
  totalCDs: number;
  totalVinyls: number;
  totalValue: number;
  averageValue: number;
  mostValuableItem: any;
  oldestYear: number | null;
  newestYear: number | null;
  genreCounts: { [genre: string]: number };
  decadeAnalysis: { [decade: string]: { count: number; value: number } };
}

export const useUserCollectionStats = (userId: string) => {
  return useQuery({
    queryKey: ["user-collection-stats", userId],
    queryFn: async (): Promise<UserCollectionStats | null> => {
      if (!userId) return null;

      // Fetch CD data for this user
      const { data: cdData, error: cdError } = await supabase
        .from("cd_scan")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true);

      if (cdError) throw cdError;

      // Fetch Vinyl data for this user
      const { data: vinylData, error: vinylError } = await supabase
        .from("vinyl2_scan")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true);

      if (vinylError) throw vinylError;

      // Combine and process data
      const allItems = [
        ...(cdData || []).map(item => ({ ...item, format: 'CD' })),
        ...(vinylData || []).map(item => ({ ...item, format: 'Vinyl' }))
      ];

      if (allItems.length === 0) {
        return {
          totalItems: 0,
          totalCDs: 0,
          totalVinyls: 0,
          totalValue: 0,
          averageValue: 0,
          mostValuableItem: null,
          oldestYear: null,
          newestYear: null,
          genreCounts: {},
          decadeAnalysis: {}
        };
      }

      const totalItems = allItems.length;
      const totalCDs = cdData?.length || 0;
      const totalVinyls = vinylData?.length || 0;

      // Calculate pricing stats
      const itemsWithPricing = allItems.filter(item => 
        item.calculated_advice_price || item.median_price || item.marketplace_price
      );
      
      const totalValue = itemsWithPricing.reduce((sum, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return sum + Number(price);
      }, 0);

      const averageValue = itemsWithPricing.length > 0 ? totalValue / itemsWithPricing.length : 0;
      
      const mostValuableItem = itemsWithPricing.length > 0 ? itemsWithPricing.reduce((max, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        const maxPrice = max.calculated_advice_price || max.median_price || max.marketplace_price || 0;
        return Number(price) > Number(maxPrice) ? item : max;
      }, itemsWithPricing[0]) : null;

      // Year analysis
      const itemsWithYear = allItems.filter(item => item.year);
      const years = itemsWithYear.map(item => item.year);
      const oldestYear = years.length > 0 ? Math.min(...years) : null;
      const newestYear = years.length > 0 ? Math.max(...years) : null;

      // Genre analysis
      const genreCounts: { [genre: string]: number } = {};
      allItems.forEach(item => {
        if (item.genre) {
          genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
        }
      });

      // Decade analysis
      const decadeAnalysis: { [decade: string]: { count: number; value: number } } = {};
      allItems.forEach(item => {
        if (item.year) {
          const decade = Math.floor(item.year / 10) * 10;
          const decadeKey = `${decade}s`;
          if (!decadeAnalysis[decadeKey]) {
            decadeAnalysis[decadeKey] = { count: 0, value: 0 };
          }
          const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
          decadeAnalysis[decadeKey].count++;
          decadeAnalysis[decadeKey].value += Number(price);
        }
      });

      return {
        totalItems,
        totalCDs,
        totalVinyls,
        totalValue,
        averageValue,
        mostValuableItem,
        oldestYear,
        newestYear,
        genreCounts,
        decadeAnalysis
      };
    },
    enabled: !!userId,
  });
};