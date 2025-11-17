import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedProduct {
  id: string;
  type: 'poster' | 'canvas' | 'metal_print' | 'tshirt' | 'sock' | 'button';
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

      // Fetch Platform Products (posters, canvas, metal prints, buttons)
      let platformQuery = supabase
        .from('platform_products')
        .select('*')
        .order('created_at', { ascending: false });

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
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        tshirtsQuery = tshirtsQuery.or(
          `album_title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`
        );
      }

      // Apply status filter for T-shirts
      if (filters?.status) {
        if (filters.status === 'published') {
          tshirtsQuery = tshirtsQuery.eq('is_published', true);
        } else if (filters.status === 'draft') {
          tshirtsQuery = tshirtsQuery.eq('is_published', false);
        }
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
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        socksQuery = socksQuery.or(
          `album_title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`
        );
      }

      // Apply status filter for Socks
      if (filters?.status) {
        if (filters.status === 'published') {
          socksQuery = socksQuery.eq('is_published', true);
        } else if (filters.status === 'draft') {
          socksQuery = socksQuery.eq('is_published', false);
        }
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

      // Debug logging
      console.log('📊 All Products Query Results:', {
        platform_products: platformResult.data?.length || 0,
        album_tshirts: tshirtsResult.data?.length || 0,
        album_socks: socksResult.data?.length || 0,
        errors: {
          platform: platformResult.error,
          tshirts: tshirtsResult.error,
          socks: socksResult.error
        }
      });

      // Process Platform Products
      if (platformResult.data) {
        platformResult.data.forEach(item => {
          // Normalize categories and tags to lowercase for case-insensitive matching
          const cats = (item.categories || []).map((c: string) => c.toLowerCase());
          const tags = (item.tags || []).map((t: string) => t.toLowerCase());
          
          // Determine product type - check in priority order (most specific first)
          let productType: UnifiedProduct['type'] = 'poster';
          
          // Check buttons first (broad detection)
          if (
            cats.includes('buttons') || 
            cats.includes('badges') ||
            tags.includes('button') ||
            tags.includes('buttons') ||
            item.title?.toLowerCase().includes('button')
          ) {
            productType = 'button';
          }
          // Check canvas
          else if (tags.includes('canvas') || cats.includes('canvas')) {
            productType = 'canvas';
          }
          // Then metal-print
          else if (tags.includes('metal-print')) {
            productType = 'metal_print';
          }
          // Skip T-shirt collection products (already in album_tshirts)
          else if (cats.includes('tshirts')) {
            return; // Skip duplicate
          }
          // Skip Sock products (already in album_socks)
          else if (cats.includes('socks')) {
            return; // Skip duplicate
          }
          // Then poster (explicit check or fallback for art)
          else if (tags.includes('poster') || item.media_type === 'art') {
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
          
          products.push({
            id: item.id,
            type: 'tshirt',
            title: item.album_title,
            artist: item.artist_name,
            price: 24.95,
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

          products.push({
            id: item.id,
            type: 'sock',
            title: item.album_title,
            artist: item.artist_name,
            price: 24.95,
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

      // Debug logging - type counts
      console.log('📊 Product type counts:', {
        buttons: products.filter(p => p.type === 'button').length,
        posters: products.filter(p => p.type === 'poster').length,
        canvas: products.filter(p => p.type === 'canvas').length,
        metal_print: products.filter(p => p.type === 'metal_print').length,
        tshirts: products.filter(p => p.type === 'tshirt').length,
        socks: products.filter(p => p.type === 'sock').length,
        total: products.length
      });

      return products;
    },
  });
};
