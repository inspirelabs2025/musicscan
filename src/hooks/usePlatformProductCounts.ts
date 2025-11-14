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
      // Base query for active art products
      const baseQuery = supabase
        .from('platform_products')
        .select('categories, price', { count: 'exact', head: false })
        .eq('status', 'active')
        .eq('media_type', 'art')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true');

      const { data: allProducts, error } = await baseQuery;
      
      if (error) throw error;

      // Client-side categorization (since categories is an array field)
      const metalPrints = allProducts?.filter(p => 
        !p.categories?.includes('POSTER') && !p.categories?.includes('CANVAS')
      ) || [];
      
      const posters = allProducts?.filter(p => 
        p.categories?.includes('POSTER')
      ) || [];
      
      const canvas = allProducts?.filter(p => 
        p.categories?.includes('CANVAS')
      ) || [];

      return {
        metalPrintsCount: metalPrints.length,
        postersCount: posters.length,
        canvasCount: canvas.length,
        metalPrintsMinPrice: metalPrints.length > 0 
          ? Math.min(...metalPrints.map(p => p.price))
          : 0,
        postersMinPrice: posters.length > 0 
          ? Math.min(...posters.map(p => p.price))
          : 0,
        canvasMinPrice: canvas.length > 0 
          ? Math.min(...canvas.map(p => p.price))
          : 0,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
