import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformProduct {
  id: string;
  title: string;
  artist: string | null;
  description: string | null;
  long_description?: string | null;
  media_type: 'cd' | 'vinyl' | 'merchandise' | 'book' | 'accessory' | 'boxset' | 'art';
  format?: string | null;
  condition_grade?: string | null;
  price: number;
  compare_at_price?: number | null;
  currency?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  allow_backorder?: boolean;
  images: string[];
  primary_image: string | null;
  slug: string;
  discogs_id?: number | null;
  discogs_url?: string | null;
  categories: string[];
  tags: string[];
  genre: string | null;
  label?: string | null;
  catalog_number?: string | null;
  year: number | null;
  country?: string | null;
  is_featured: boolean;
  is_on_sale: boolean;
  is_new: boolean;
  featured_until?: string | null;
  view_count: number;
  purchase_count?: number;
  status: 'active' | 'draft' | 'archived' | 'sold_out';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  metadata?: {
    style_variants?: Array<{
      style: string;
      url: string;
      label: string;
      emoji: string;
    }>;
    has_style_options?: boolean;
    default_style?: string;
    [key: string]: any;
  } | null;
}

interface UsePlatformProductsFilters {
  mediaType?: string;
  category?: string;
  categoryContains?: string; // Filter where any category contains this string (case-insensitive)
  featured?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export const usePlatformProducts = (filters?: UsePlatformProductsFilters) => {
  return useQuery({
    queryKey: ['platform-products', filters],
    queryFn: async () => {
      // Performance: select only essential fields for shop grids
      let query = supabase
        .from('platform_products')
        .select('id,title,artist,price,primary_image,slug,categories,is_featured,is_on_sale,is_new,stock_quantity,allow_backorder,media_type,status')
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .or('stock_quantity.gt.0,allow_backorder.eq.true')
        .not('primary_image', 'like', 'data:%');
      
      if (filters?.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }
      
      if (filters?.category) {
        query = query.contains('categories', [filters.category]);
      }
      
      // Filter where categories array contains the exact value
      if (filters?.categoryContains) {
        query = query.contains('categories', [filters.categoryContains]);
      }
      
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }
      
      if (filters?.onSale) {
        query = query.eq('is_on_sale', true);
      }
      
      if (filters?.isNew) {
        query = query.eq('is_new', true);
      }
      
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      
      query = query.order('created_at', { ascending: false });
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as PlatformProduct[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};
