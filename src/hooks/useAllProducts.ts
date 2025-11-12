import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedProduct {
  id: string;
  type: 'poster' | 'canvas' | 'metal_print' | 'tshirt' | 'sock';
  title: string;
  artist: string | null;
  price: number;
  image: string;
  status: 'active' | 'draft' | 'published' | 'archived' | 'sold_out';
  created_at: string;
  view_count: number;
  purchase_count?: number;
  // Source reference
  sourceTable: 'platform_products' | 'album_tshirts' | 'album_socks';
  sourceId: string;
  rawData: any;
}

interface UseAllProductsFilters {
  search?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const useAllProducts = (filters?: UseAllProductsFilters) => {
  return useQuery({
    queryKey: ['all-products', filters],
    queryFn: async () => {
      const products: UnifiedProduct[] = [];

      // Fetch Platform Products (posters, canvas, metal prints)
      let platformQuery = supabase
        .from('platform_products')
        .select('*');

      if (filters?.search) {
        platformQuery = platformQuery.or(
          `title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        platformQuery = platformQuery.eq('status', filters.status);
      }

      if (filters?.minPrice !== undefined) {
        platformQuery = platformQuery.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        platformQuery = platformQuery.lte('price', filters.maxPrice);
      }

      if (filters?.dateFrom) {
        platformQuery = platformQuery.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        platformQuery = platformQuery.lte('created_at', filters.dateTo);
      }

      // Fetch T-Shirts
      let tshirtsQuery = supabase
        .from('album_tshirts')
        .select('*, product:platform_products(*)');

      if (filters?.search) {
        tshirtsQuery = tshirtsQuery.or(
          `album_title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.dateFrom) {
        tshirtsQuery = tshirtsQuery.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        tshirtsQuery = tshirtsQuery.lte('created_at', filters.dateTo);
      }

      // Fetch Socks
      let socksQuery = supabase
        .from('album_socks')
        .select('*, product:platform_products(*)');

      if (filters?.search) {
        socksQuery = socksQuery.or(
          `album_title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.dateFrom) {
        socksQuery = socksQuery.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        socksQuery = socksQuery.lte('created_at', filters.dateTo);
      }

      // Execute all queries in parallel
      const [platformResult, tshirtsResult, socksResult] = await Promise.all([
        platformQuery,
        tshirtsQuery,
        socksQuery
      ]);

      // Process Platform Products
      if (platformResult.data) {
        platformResult.data.forEach(item => {
          // Determine product type based on media_type or tags
          let productType: UnifiedProduct['type'] = 'poster';
          if (item.media_type === 'art' && item.tags?.includes('metal-print')) {
            productType = 'metal_print';
          } else if (item.media_type === 'art' && item.tags?.includes('canvas')) {
            productType = 'canvas';
          } else if (item.media_type === 'art' && item.tags?.includes('poster')) {
            productType = 'poster';
          }

          // Apply type filter
          if (filters?.type && filters.type !== 'all' && productType !== filters.type) {
            return;
          }

          products.push({
            id: item.id,
            type: productType,
            title: item.title,
            artist: item.artist,
            price: item.price,
            image: item.primary_image || '',
            status: item.status,
            created_at: item.created_at,
            view_count: item.view_count || 0,
            purchase_count: item.purchase_count || 0,
            sourceTable: 'platform_products',
            sourceId: item.id,
            rawData: item
          });
        });
      }

      // Process T-Shirts
      if (tshirtsResult.data) {
        tshirtsResult.data.forEach(item => {
          if (filters?.type && filters.type !== 'all' && filters.type !== 'tshirt') {
            return;
          }

          const linkedProduct = item.product as any;
          
          products.push({
            id: item.id,
            type: 'tshirt',
            title: item.album_title,
            artist: item.artist_name,
            price: linkedProduct?.price || 24.95,
            image: item.mockup_url || item.base_design_url || '',
            status: item.is_published ? 'published' : 'draft',
            created_at: item.created_at,
            view_count: item.view_count || 0,
            sourceTable: 'album_tshirts',
            sourceId: item.id,
            rawData: item
          });
        });
      }

      // Process Socks
      if (socksResult.data) {
        socksResult.data.forEach(item => {
          if (filters?.type && filters.type !== 'all' && filters.type !== 'sock') {
            return;
          }

          const linkedProduct = item.product as any;

          products.push({
            id: item.id,
            type: 'sock',
            title: item.album_title,
            artist: item.artist_name,
            price: linkedProduct?.price || 14.95,
            image: item.mockup_url || item.base_design_url || '',
            status: item.is_published ? 'published' : 'draft',
            created_at: item.created_at,
            view_count: item.view_count || 0,
            sourceTable: 'album_socks',
            sourceId: item.id,
            rawData: item
          });
        });
      }

      // Sort by created_at descending
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return products;
    },
  });
};
