import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CollectionItem {
  id: string;
  user_id?: string;
  artist: string | null;
  title: string | null;
  year: number | null;
  catalog_number: string | null;
  label: string | null;
  matrix_number?: string | null;
  format?: string | null;
  genre?: string | null;
  country?: string | null;
  currency: string | null;
  condition_grade: string | null;
  is_public?: boolean | null;
  is_for_sale?: boolean | null;
  marketplace_price: number | null;
  marketplace_allow_offers?: boolean | null;
  marketplace_status?: string | null;
  marketplace_comments?: string | null;
  marketplace_location?: string | null;
  marketplace_sleeve_condition?: string | null;
  marketplace_weight?: number | null;
  marketplace_format_quantity?: number | null;
  marketplace_external_id?: string | null;
  calculated_advice_price?: number | null;
  discogs_id?: number | null;
  discogs_url?: string | null;
  front_image?: string | null;
  back_image?: string | null;
  barcode_image?: string | null;
  catalog_image?: string | null;
  matrix_image?: string | null;
  additional_image?: string | null;
  shop_description?: string | null;
  created_at: string;
  updated_at?: string;
  media_type: 'cd' | 'vinyl' | 'product';
  // Additional fields for shop products
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock_quantity?: number;
  weight?: number;
  shipping_cost?: number;
  images?: string[];
}

export const useShopItems = () => {
  const { user } = useAuth();

  const { data: shopItems = [], isLoading } = useQuery({
    queryKey: ["shop-items", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch CD scans, Vinyl scans, and Shop products in parallel
      const [cdResults, vinylResults, productResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, front_image, back_image, 
            barcode_image, matrix_image, calculated_advice_price, lowest_price, 
            median_price, highest_price, user_id
          `)
          .eq("user_id", user.id)
          .eq("is_for_sale", true),
        supabase
          .from("vinyl2_scan")
          .select(`
            id, artist, title, label, catalog_number, year, discogs_id, discogs_url,
            is_public, is_for_sale, shop_description, condition_grade, 
            marketplace_price, currency, created_at, catalog_image, matrix_image, 
            additional_image, calculated_advice_price, lowest_price, median_price, 
            highest_price, user_id
          `)
          .eq("user_id", user.id)
          .eq("is_for_sale", true),
        supabase
          .from("shop_products")
          .select("*")
          .eq("admin_user_id", user.id)
          .eq("is_active", true)
      ]);

      if (cdResults.error) throw cdResults.error;
      if (vinylResults.error) throw vinylResults.error;
      if (productResults.error) throw productResults.error;

      // Combine and format results
      const cdItems: CollectionItem[] = (cdResults.data || []).map(item => ({
        ...item,
        matrix_number: item.matrix_image || null,
        format: 'CD',
        genre: null,
        country: null,
        catalog_image: item.front_image || null,
        additional_image: item.back_image || null,
        updated_at: item.created_at,
        marketplace_allow_offers: true,
        marketplace_status: 'For Sale',
        marketplace_comments: item.shop_description,
        marketplace_location: 'Netherlands',
        marketplace_sleeve_condition: null,
        marketplace_weight: 100,
        marketplace_format_quantity: 1,
        marketplace_external_id: null,
        media_type: "cd" as const
      }));

      const vinylItems: CollectionItem[] = (vinylResults.data || []).map(item => ({
        ...item,
        matrix_number: item.matrix_image || null,
        format: 'Vinyl',
        genre: null,
        country: null,
        front_image: null,
        back_image: null,
        barcode_image: null,
        updated_at: item.created_at,
        marketplace_allow_offers: true,
        marketplace_status: 'For Sale',
        marketplace_comments: item.shop_description,
        marketplace_location: 'Netherlands',
        marketplace_sleeve_condition: null,
        marketplace_weight: 230,
        marketplace_format_quantity: 1,
        marketplace_external_id: null,
        media_type: "vinyl" as const
      }));

      // Transform shop products to match CollectionItem interface
      const productItems: CollectionItem[] = (productResults.data || []).map(item => ({
        id: item.id,
        user_id: item.admin_user_id,
        artist: null,
        title: item.name,
        year: null,
        catalog_number: null,
        label: null,
        matrix_number: null,
        format: null,
        genre: null,
        country: null,
        currency: item.currency,
        condition_grade: null,
        is_public: item.is_active,
        is_for_sale: item.is_active,
        marketplace_price: item.price,
        marketplace_allow_offers: true,
        marketplace_status: 'For Sale',
        marketplace_comments: item.description,
        marketplace_location: 'Netherlands',
        marketplace_sleeve_condition: null,
        marketplace_weight: item.weight,
        marketplace_format_quantity: 1,
        marketplace_external_id: null,
        calculated_advice_price: item.price,
        discogs_id: null,
        discogs_url: null,
        catalog_image: item.images?.[0] || null,
        matrix_image: null,
        additional_image: null,
        shop_description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        media_type: 'product' as const,
        // Product-specific fields
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        stock_quantity: item.stock_quantity,
        weight: item.weight,
        shipping_cost: item.shipping_cost,
        images: item.images,
      }));

      return [...cdItems, ...vinylItems, ...productItems];
    },
    enabled: !!user?.id,
  });

  return {
    shopItems,
    isLoading,
  };
};