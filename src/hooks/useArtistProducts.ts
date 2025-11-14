import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useArtistProducts = (artistName: string, limit: number = 12) => {
  return useQuery({
    queryKey: ['artist-products', artistName, limit],
    queryFn: async () => {
      if (!artistName) return [];

      const { data, error } = await supabase
        .from('platform_products')
        .select('*')
        .ilike('artist', `%${artistName}%`)
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching artist products:', error);
        throw error;
      }

      return data;
    },
    enabled: !!artistName,
  });
};
