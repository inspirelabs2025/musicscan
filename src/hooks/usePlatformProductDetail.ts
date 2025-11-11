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
  mediaType?: string,
  productTags?: string[],
  limit = 4
) => {
  return useQuery({
    queryKey: ['similar-products', productId, category, artist, mediaType, productTags],
    queryFn: async () => {
      const results: PlatformProduct[] = [];
      const resultIds = new Set<string>();
      
      // Determine product type for filtering
      const isCanvas = productTags?.includes('canvas') || category?.toLowerCase() === 'canvas';
      const isPoster = productTags?.includes('poster') || category?.toLowerCase() === 'poster';
      const isMetalPrint = !isCanvas && !isPoster && (mediaType === 'metal-print' || mediaType === 'art');
      
      console.log('🔍 Finding similar products:', { isCanvas, isPoster, isMetalPrint, productTags, category, mediaType });
      
      // Helper function to apply type-specific filters
      const applyTypeFilter = (query: any) => {
        if (isCanvas) {
          // Canvas: only show other canvas products
          return query.contains('tags', ['canvas']);
        } else if (isPoster) {
          // Poster: only show other posters
          return query.or('tags.cs.{poster},categories.cs.{POSTER}');
        } else if (isMetalPrint) {
          // Metal print: exclude canvas and posters
          return query
            .not('tags', 'cs', '{canvas}')
            .not('tags', 'cs', '{poster}')
            .not('categories', 'cs', '{POSTER,CANVAS}');
        }
        return query;
      };
      
      // TIER 1: Same artist + category (most relevant)
      if (artist && category) {
        let query = supabase
          .from('platform_products')
          .select('*')
          .eq('status', 'active')
          .not('published_at', 'is', null)
          .gt('stock_quantity', 0)
          .neq('id', productId)
          .ilike('artist', `%${artist}%`)
          .contains('categories', [category])
          .limit(limit * 2);
        
        query = applyTypeFilter(query);
        const { data } = await query;
        
        if (data && data.length > 0) {
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
        
        query = applyTypeFilter(query);
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      // TIER 3: Same artist, different categories (but same type)
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
        
        query = applyTypeFilter(query);
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      // TIER 4: Random popular products of same type (fallback)
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
        
        query = applyTypeFilter(query);
        const { data } = await query;
        
        if (data && data.length > 0) {
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, remaining);
          shuffled.forEach(item => {
            results.push(item);
            resultIds.add(item.id);
          });
        }
      }
      
      console.log('✅ Found similar products:', results.length);
      return results;
    },
    enabled: !!productId,
  });
};
