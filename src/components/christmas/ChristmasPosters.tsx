import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Image, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  artist: string | null;
  slug: string;
  primary_image: string | null;
  price: number;
  media_type: string;
}

export const ChristmasPosters = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['christmas-posters'],
    queryFn: async () => {
      // Fetch products with christmas/kerst tags
      const { data, error } = await supabase
        .from('platform_products')
        .select('id, title, artist, slug, primary_image, price, media_type, tags')
        .eq('status', 'active')
        .or('media_type.eq.poster,media_type.eq.canvas,media_type.eq.metal-print')
        .contains('tags', ['christmas'])
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        // Fallback: try with 'kerst' tag
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('platform_products')
          .select('id, title, artist, slug, primary_image, price, media_type, tags')
          .eq('status', 'active')
          .or('media_type.eq.poster,media_type.eq.canvas,media_type.eq.metal-print')
          .contains('tags', ['kerst'])
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (fallbackError) throw fallbackError;
        return fallbackData as Product[];
      }
      
      return data as Product[];
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🖼️ Kerst Posters & Art
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  const getProductTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'poster': return 'Poster';
      case 'canvas': return 'Canvas';
      case 'metal-print': return 'Metal Print';
      default: return 'Art Print';
    }
  };

  const getProductPrice = (mediaType: string, price: number) => {
    // Default prices based on product type
    if (price) return price;
    switch (mediaType) {
      case 'poster': return 49.95;
      case 'canvas': return 79.95;
      case 'metal-print': return 89.95;
      default: return 49.95;
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
              Kerst Art Prints
            </span>
            <span className="text-xl">🎄</span>
          </CardTitle>
          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
            🎁 {products.length} designs
          </Badge>
        </div>
        <p className="text-base text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">Kerst muziek artwork</span> — posters, canvas en metal prints
        </p>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/product/${product.slug}`}>
                <div className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                  {/* Image section */}
                  <div className="relative aspect-[3/4] bg-muted">
                    <img
                      src={product.primary_image || '/placeholder.svg'}
                      alt={product.title}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background/80 text-foreground text-xs">
                        {getProductTypeLabel(product.media_type)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Content footer */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <Image className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Kerst Art</span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {product.artist || 'Kerst Collectie'}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.title}</p>
                    <p className="text-sm font-medium text-foreground">
                      €{getProductPrice(product.media_type, product.price).toFixed(2).replace('.', ',')}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-red-600 group-hover:text-red-700 pt-1">
                      <span>Bekijk product</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex justify-center pt-6 border-t border-border/50">
          <Link to="/shop">
            <Button className="bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 group">
              <Image className="h-4 w-4 mr-2" />
              Bekijk alle kerst art
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
