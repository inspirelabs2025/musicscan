import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CollectionStats {
  totalItems: number;
  totalCDs: number;
  totalVinyls: number;
  totalValue: number;
  averageValue: number;
  mostValuableItem: any;
  itemsWithPricing: number;
  itemsWithoutPricing: number;
  genres: { genre: string; count: number; value: number }[];
  artists: { artist: string; count: number; value: number }[];
  years: { year: number; count: number }[];
  conditions: { condition: string; count: number }[];
  priceRanges: { range: string; count: number }[];
}

export const useCollectionStats = () => {
  return useQuery({
    queryKey: ["collection-stats"],
    queryFn: async (): Promise<CollectionStats> => {
      // Fetch CD data
      const { data: cdData, error: cdError } = await supabase
        .from("cd_scan")
        .select("*");

      if (cdError) throw cdError;

      // Fetch Vinyl data
      const { data: vinylData, error: vinylError } = await supabase
        .from("vinyl2_scan")
        .select("*");

      if (vinylError) throw vinylError;

      // Combine and process data
      const allItems = [
        ...(cdData || []).map(item => ({ ...item, format: 'CD' })),
        ...(vinylData || []).map(item => ({ ...item, format: 'Vinyl' }))
      ];

      const totalItems = allItems.length;
      const totalCDs = cdData?.length || 0;
      const totalVinyls = vinylData?.length || 0;

      // Calculate pricing stats
      const itemsWithPricing = allItems.filter(item => 
        item.median_price || item.calculated_advice_price || item.marketplace_price
      );
      
      const totalValue = itemsWithPricing.reduce((sum, item) => {
        const price = item.median_price || item.calculated_advice_price || item.marketplace_price || 0;
        return sum + Number(price);
      }, 0);

      const averageValue = itemsWithPricing.length > 0 ? totalValue / itemsWithPricing.length : 0;
      
      const mostValuableItem = itemsWithPricing.length > 0 ? itemsWithPricing.reduce((max, item) => {
        const price = item.median_price || item.calculated_advice_price || item.marketplace_price || 0;
        const maxPrice = max.median_price || max.calculated_advice_price || max.marketplace_price || 0;
        return Number(price) > Number(maxPrice) ? item : max;
      }, itemsWithPricing[0]) : null;

      // Genre analysis
      const genreMap = new Map();
      allItems.forEach(item => {
        if (item.genre) {
          const price = item.median_price || item.calculated_advice_price || item.marketplace_price || 0;
          const existing = genreMap.get(item.genre) || { count: 0, value: 0 };
          genreMap.set(item.genre, {
            count: existing.count + 1,
            value: existing.value + Number(price)
          });
        }
      });

      const genres = Array.from(genreMap.entries()).map(([genre, data]) => ({
        genre,
        count: data.count,
        value: data.value
      })).sort((a, b) => b.count - a.count);

      // Artist analysis
      const artistMap = new Map();
      allItems.forEach(item => {
        if (item.artist) {
          const price = item.median_price || item.calculated_advice_price || item.marketplace_price || 0;
          const existing = artistMap.get(item.artist) || { count: 0, value: 0 };
          artistMap.set(item.artist, {
            count: existing.count + 1,
            value: existing.value + Number(price)
          });
        }
      });

      const artists = Array.from(artistMap.entries()).map(([artist, data]) => ({
        artist,
        count: data.count,
        value: data.value
      })).sort((a, b) => b.count - a.count);

      // Year analysis
      const yearMap = new Map();
      allItems.forEach(item => {
        if (item.year) {
          const existing = yearMap.get(item.year) || 0;
          yearMap.set(item.year, existing + 1);
        }
      });

      const years = Array.from(yearMap.entries()).map(([year, count]) => ({
        year,
        count
      })).sort((a, b) => a.year - b.year);

      // Condition analysis
      const conditionMap = new Map();
      allItems.forEach(item => {
        const condition = item.condition_grade || item.marketplace_sleeve_condition || 'Unknown';
        const existing = conditionMap.get(condition) || 0;
        conditionMap.set(condition, existing + 1);
      });

      const conditions = Array.from(conditionMap.entries()).map(([condition, count]) => ({
        condition,
        count
      }));

      // Price range analysis
      const priceRanges = [
        { range: '€0-10', count: 0 },
        { range: '€10-25', count: 0 },
        { range: '€25-50', count: 0 },
        { range: '€50-100', count: 0 },
        { range: '€100+', count: 0 }
      ];

      itemsWithPricing.forEach(item => {
        const price = item.median_price || item.calculated_advice_price || item.marketplace_price || 0;
        const numPrice = Number(price);
        if (numPrice <= 10) priceRanges[0].count++;
        else if (numPrice <= 25) priceRanges[1].count++;
        else if (numPrice <= 50) priceRanges[2].count++;
        else if (numPrice <= 100) priceRanges[3].count++;
        else priceRanges[4].count++;
      });

      return {
        totalItems,
        totalCDs,
        totalVinyls,
        totalValue,
        averageValue,
        mostValuableItem,
        itemsWithPricing: itemsWithPricing.length,
        itemsWithoutPricing: totalItems - itemsWithPricing.length,
        genres,
        artists,
        years,
        conditions,
        priceRanges
      };
    }
  });
};