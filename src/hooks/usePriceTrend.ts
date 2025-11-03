import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PriceTrend {
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  price_changes: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export const usePriceTrend = (discogsId: number | null) => {
  return useQuery({
    queryKey: ["price-trend", discogsId],
    queryFn: async (): Promise<PriceTrend | null> => {
      if (!discogsId) return null;

      const { data, error } = await supabase
        .rpc('get_price_trend', { p_discogs_id: discogsId });

      if (error) {
        console.error('Error fetching price trend:', error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: !!discogsId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
};

interface PriceChange {
  id: string;
  scan_type: 'cd' | 'vinyl' | 'ai';
  old_price: number | null;
  new_price: number;
  price_change_percent: number;
  changed_at: string;
}

export const useRecentPriceChanges = (discogsId: number | null, limit = 5) => {
  return useQuery({
    queryKey: ["price-changes", discogsId, limit],
    queryFn: async (): Promise<PriceChange[]> => {
      if (!discogsId) return [];

      const { data, error } = await supabase
        .from('price_change_log')
        .select('*')
        .eq('discogs_id', discogsId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching price changes:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!discogsId,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
};
