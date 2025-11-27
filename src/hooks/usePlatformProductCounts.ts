import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductCounts {
  metalPrintsCount: number;
  postersCount: number;
  canvasCount: number;
  metalPrintsMinPrice: number;
  postersMinPrice: number;
  canvasMinPrice: number;
}

export const usePlatformProductCounts = () => {
  return useQuery({
    queryKey: ['platform-product-counts'],
    queryFn: async (): Promise<ProductCounts> => {
      // Query posters count and min price (categories contains 'POSTER')
      const { data: postersData, count: postersCount } = await supabase
        .from('platform_products')
        .select('price', { count: 'exact' })
        .eq('status', 'active')
        .eq('media_type', 'art')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true')
        .contains('categories', ['POSTER'])
        .order('price', { ascending: true })
        .limit(1);

      // Query canvas count and min price (categories contains 'CANVAS')
      const { data: canvasData, count: canvasCount } = await supabase
        .from('platform_products')
        .select('price', { count: 'exact' })
        .eq('status', 'active')
        .eq('media_type', 'art')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true')
        .contains('categories', ['CANVAS'])
        .order('price', { ascending: true })
        .limit(1);

      // Query total art count
      const { count: totalArtCount } = await supabase
        .from('platform_products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('media_type', 'art')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true');

      // Get min price for metal prints (exclude posters and canvas)
      const { data: metalData } = await supabase
        .from('platform_products')
        .select('price')
        .eq('status', 'active')
        .eq('media_type', 'art')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true')
        .not('categories', 'cs', '{"POSTER"}')
        .not('categories', 'cs', '{"CANVAS"}')
        .order('price', { ascending: true })
        .limit(1);

      const metalPrintsCount = (totalArtCount || 0) - (postersCount || 0) - (canvasCount || 0);

      return {
        metalPrintsCount: metalPrintsCount,
        postersCount: postersCount || 0,
        canvasCount: canvasCount || 0,
        metalPrintsMinPrice: metalData?.[0]?.price || 0,
        postersMinPrice: postersData?.[0]?.price || 0,
        canvasMinPrice: canvasData?.[0]?.price || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
