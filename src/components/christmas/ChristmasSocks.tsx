import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChristmasSockProduct {
  id: string;
  slug: string;
  title: string;
  artist: string;
  price: number;
  primary_image: string | null;
  view_count: number;
  is_featured: boolean;
}

export const ChristmasSocks = () => {
  // Fetch Christmas socks from platform_products (the actual shop products)
  const { data: socks, isLoading } = useQuery({
    queryKey: ['christmas-sock-products'],
    queryFn: async () => {
      // 1) Haal de christmas sock product_id's op
      const { data: albumSocks, error: albumError } = await supabase
        .from('album_socks')
        .select('product_id')
        .eq('pattern_type', 'christmas')
        .not('product_id', 'is', null)
        .limit(50);

      if (albumError) throw albumError;

      const productIds = (albumSocks || [])
        .map((s) => s.product_id)
        .filter(Boolean) as string[];

      if (productIds.length === 0) return [];

      // 2) Fetch de shop producten (sock mockup via primary_image)
      // BELANGRIJK: in() met veel UUIDs kan timeouts geven; daarom chunking.
      const chunkSize = 5;
      const chunks: string[][] = [];
      for (let i = 0; i < productIds.length; i += chunkSize) {
        chunks.push(productIds.slice(i, i + chunkSize));
      }

      const all: ChristmasSockProduct[] = [];
      for (const ids of chunks) {
        const { data, error } = await supabase
          .from('platform_products')
          .select('id, slug, title, artist, price, primary_image, view_count, is_featured')
          .in('id', ids)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        all.push(...((data || []) as ChristmasSockProduct[]));
      }

      // Dedup + limit
      const byId = new Map<string, ChristmasSockProduct>();
      for (const p of all) byId.set(p.id, p);

      return Array.from(byId.values()).slice(0, 8);
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧦 Kerst Sokken Collectie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!socks || socks.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🧦</span>
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Sokken Collectie
            </span>
            <span className="text-xl">🎄</span>
          </CardTitle>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
            🎁 {socks.length} designs
          </Badge>
        </div>
        <p className="text-base text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">Feestelijke kerst sokken</span> — het perfecte cadeau voor muziekliefhebbers
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {socks.map((sock, index) => (
            <motion.div
              key={sock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/product/${sock.slug}`}>
                <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-green-500 h-full">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {sock.primary_image ? (
                      <img
                        src={sock.primary_image}
                        alt={`${sock.artist} - ${sock.title} kerst sokken`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100/30 to-green-100/30 dark:from-red-950/20 dark:to-green-950/20">
                        <span className="text-6xl">🧦</span>
                      </div>
                    )}
                    
                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className="bg-red-600 text-white font-bold">
                        🎄 Kerst Editie
                      </Badge>
                      {sock.is_featured && (
                        <Badge className="bg-vinyl-gold text-black font-bold">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* View Count */}
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="secondary" className="bg-black/60 text-white border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        {sock.view_count || 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Premium Merino</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                      {sock.artist}
                    </p>
                    <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-green-600 transition-colors">
                      {sock.title}
                    </h3>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-lg font-bold text-primary">€{sock.price.toFixed(2)}</p>
                      <div className="flex items-center gap-1 text-sm text-green-600 group-hover:text-green-700">
                        <span>Bekijk</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex justify-center pt-6 border-t border-border/50">
          <Link to="/socks">
            <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 group">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Bekijk alle muziek sokken
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
