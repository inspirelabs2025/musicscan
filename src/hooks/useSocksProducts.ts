import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocksShopProduct {
  id: string;
  title: string;
  artist: string | null;
  description: string | null;
  price: number;
  slug: string;
  categories: string[];
  tags: string[];
  is_featured: boolean;
  view_count: number;
  created_at: string;
  image_url: string | null;
}

export const useSocksProducts = (filters?: { featured?: boolean }) => {
  return useQuery({
    queryKey: ["socks-products", filters],
    queryFn: async () => {
      // 1) Alle socks-designs ophalen (incl. christmas), met hun echte socks-visual (base_design_url)
      const { data: sockDesigns, error: socksError } = await supabase
        .from("album_socks")
        .select("product_id, base_design_url")
        .not("product_id", "is", null)
        .limit(1000);

      if (socksError) throw socksError;

      const imageByProductId = new Map<string, string>();
      for (const s of sockDesigns || []) {
        if (s.product_id && s.base_design_url) imageByProductId.set(s.product_id, s.base_design_url);
      }

      const productIds = Array.from(imageByProductId.keys());
      if (productIds.length === 0) return [] as SocksShopProduct[];

      // 2) Product data ophalen
      const chunkSize = 25;
      const chunks: string[][] = [];
      for (let i = 0; i < productIds.length; i += chunkSize) {
        chunks.push(productIds.slice(i, i + chunkSize));
      }

      const all: SocksShopProduct[] = [];
      for (const ids of chunks) {
        let query = supabase
          .from("platform_products")
          .select(
            "id,title,artist,description,price,slug,categories,tags,is_featured,view_count,created_at,stock_quantity,allow_backorder,status,published_at"
          )
          .in("id", ids)
          .eq("status", "active")
          .not("published_at", "is", null)
          .lte("published_at", new Date().toISOString())
          .or("stock_quantity.gt.0,allow_backorder.eq.true")
          .order("created_at", { ascending: false });

        if (filters?.featured) query = query.eq("is_featured", true);

        const { data, error } = await query;
        if (error) throw error;

        for (const p of (data || []) as any[]) {
          const image_url = imageByProductId.get(p.id) || null;
          all.push({
            id: p.id,
            title: p.title,
            artist: p.artist,
            description: p.description,
            price: p.price,
            slug: p.slug,
            categories: p.categories || [],
            tags: p.tags || [],
            is_featured: !!p.is_featured,
            view_count: p.view_count || 0,
            created_at: p.created_at,
            image_url,
          });
        }
      }

      // Dedup
      const byId = new Map<string, SocksShopProduct>();
      for (const p of all) byId.set(p.id, p);

      return Array.from(byId.values());
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
