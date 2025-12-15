import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ShoppingBag, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChristmasProduct {
  id: string;
  title: string;
  artist: string;
  price: number;
  primary_image: string;
  slug: string;
  media_type: string;
  categories: string[];
}

export const ChristmasShopProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['christmas-shop-products'],
    queryFn: async () => {
      // Get products created from Christmas singles (poster and canvas)
      const { data, error } = await supabase
        .from('platform_products')
        .select('id, title, artist, price, primary_image, slug, media_type, categories')
        .eq('status', 'active')
        .not('primary_image', 'is', null)
        // Base64 images veroorzaken timeouts/overload → altijd uitsluiten in de query
        .not('primary_image', 'like', 'data:%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Filter for Christmas products (created by backfill with Christmas style)
      // Look for products with Christmas-related artists or recent art products
      const christmasProducts = (data || []).filter(p => 
        p.categories?.includes('ART') || 
        p.categories?.includes('POSTER') || 
        p.categories?.includes('CANVAS')
      ).slice(0, 12);
      
      return christmasProducts as ChristmasProduct[];
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-red-500" />
            Kerst Shop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getProductTypeLabel = (categories: string[]) => {
    if (categories?.includes('CANVAS')) return 'Canvas';
    if (categories?.includes('POSTER')) return 'Poster';
    return 'Art';
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-green-500" />
            <span className="bg-gradient-to-r from-green-500 to-red-500 bg-clip-text text-transparent">
              Kerst Art Shop
            </span>
            <span className="text-2xl">🎁</span>
          </CardTitle>
          <Badge variant="outline" className="border-green-500/50 text-green-500">
            {products.length} producten
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Unieke kunstposters en canvas geïnspireerd door klassieke kerstliedjes
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/product/${product.slug}`}>
                <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border border-border/50 hover:border-primary/50 transition-colors">
                  <img
                    src={product.primary_image}
                    alt={product.title}
                    className="w-full h-full object-contain bg-background transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs bg-background/90">
                      {getProductTypeLabel(product.categories)}
                    </Badge>
                  </div>
                  
                  {/* Price badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600 text-white text-xs">
                      {formatPrice(product.price)}
                    </Badge>
                  </div>
                  
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-medium text-sm truncate">
                      {product.title}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {product.artist}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-border/50">
          <Link to="/shop?category=art">
            <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Gift className="h-4 w-4 mr-2" />
              Bekijk alle Kerst Art
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
