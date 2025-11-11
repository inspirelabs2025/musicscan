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

export const useSimilarProducts = (
  productId: string, 
  category?: string, 
  artist?: string,
  limit = 4
) => {
  return useQuery({
    queryKey: ['similar-products', productId, category, artist],
    queryFn: async () => {
      const results: PlatformProduct[] = [];
      const resultIds = new Set<string>();
      
      // TIER 1: Same artist + category (most relevant)
      if (artist && category) {
        const { data } = await supabase
          .from('platform_products')
          .select('*')
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .gt('stock_quantity', 0)
          .neq('id', productId)
          .ilike('artist', `%${artist}%`)
          .contains('categories', [category])
          .limit(limit * 2);
        
        if (data && data.length > 0) {
          // Shuffle and take limit
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, limit);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      // TIER 2: Same category, different artists
      if (results.length < limit && category) {
        const remaining = limit - results.length;
        const excludeIds = Array.from(resultIds);
        
        let query = supabase
          .from('platform_products')
          .select('*')
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .gt('stock_quantity', 0)
          .neq('id', productId)
          .contains('categories', [category])
          .limit(remaining * 2);
        
        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      // TIER 3: Same artist, different categories
      if (results.length < limit && artist) {
        const remaining = limit - results.length;
        const excludeIds = Array.from(resultIds);
        
        let query = supabase
          .from('platform_products')
          .select('*')
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .gt('stock_quantity', 0)
          .neq('id', productId)
          .ilike('artist', `%${artist}%`)
          .limit(remaining * 2);
        
        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      // TIER 4: Random popular products (fallback)
      if (results.length < limit) {
        const remaining = limit - results.length;
        const excludeIds = Array.from(resultIds);
        
        let query = supabase
          .from('platform_products')
          .select('*')
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .gt('stock_quantity', 0)
          .neq('id', productId)
          .order('view_count', { ascending: false })
          .limit(remaining * 3);
        
        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      return results;
    },
    enabled: !!productId,
  });
};
