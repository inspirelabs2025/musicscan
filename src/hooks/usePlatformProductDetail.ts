import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformProduct } from "./usePlatformProducts";

export const usePlatformProductDetail = (slug: string) => {
  const queryClient = useQueryClient();

  const incrementViewMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.rpc('increment_product_view', {
        p_product_id: productId
      });
      if (error) throw error;
    },
  });

  const query = useQuery({
    queryKey: ['platform-product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_products')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      // Increment view count asynchronously
      if (data?.id) {
        incrementViewMutation.mutate(data.id);
      }
      
      return data as PlatformProduct;
    },
    enabled: !!slug,
  });

  return query;
};

export const useSimilarProducts = (productId: string, category?: string, limit = 4) => {
  return useQuery({
    queryKey: ['similar-products', productId, category],
    queryFn: async () => {
      let query = supabase
        .from('platform_products')
        .select('*')
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .gt('stock_quantity', 0)
        .neq('id', productId);
      
      if (category) {
        query = query.contains('categories', [category]);
      }
      
      const { data, error } = await query
        .order('view_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as PlatformProduct[];
    },
    enabled: !!productId,
  });
};
