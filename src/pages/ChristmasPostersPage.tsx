import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Image, ArrowLeft, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Footer } from '@/components/Footer';

interface ChristmasPoster {
  id: string;
  title: string;
  artist: string | null;
  slug: string;
  primary_image: string | null;
  price: number;
  media_type: string;
  tags: string[] | null;
}

type FilterType = 'all' | 'poster' | 'canvas' | 'metal-print';

export default function ChristmasPostersPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['christmas-posters-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_products')
        .select('id, title, artist, slug, primary_image, price, media_type, tags')
        .eq('status', 'active')
        .contains('tags', ['christmas'])
        .not('primary_image', 'like', 'data:%')
        .in('media_type', ['poster', 'canvas', 'metal-print', 'art'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ChristmasPoster[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredProducts = products?.filter(product => {
    if (filter === 'all') return true;
    return product.media_type === filter;
  }) || [];

  const counts = {
    all: products?.length || 0,
    poster: products?.filter(p => p.media_type === 'poster').length || 0,
    canvas: products?.filter(p => p.media_type === 'canvas').length || 0,
    'metal-print': products?.filter(p => p.media_type === 'metal-print').length || 0,
  };

  const getProductTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'poster': return 'Poster';
      case 'canvas': return 'Canvas';
      case 'metal-print': return 'Metal Print';
      default: return 'Art Print';
    }
  };

  const getProductPrice = (mediaType: string, price: number) => {
    if (price) return price;
    switch (mediaType) {
      case 'poster': return 49.95;
      case 'canvas': return 79.95;
      case 'metal-print': return 89.95;
      default: return 49.95;
    }
  };

  return (
    <>
      <Helmet>
        <title>🎄 Kerst Posters & Art | MusicScan</title>
        <meta name="description" content="Ontdek onze kerst muziek posters, canvas doeken en metal prints. Unieke artwork van iconische kerstliedjes als wanddecoratie." />
        <meta property="og:title" content="🎄 Kerst Posters & Art | MusicScan" />
        <meta property="og:description" content="Kerst muziek artwork: posters, canvas en metal prints van iconische kerstliedjes." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-red-950/5 to-green-950/5">
        {/* Hero Section */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-green-900/10 to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/kerst">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Kerst
              </Button>
            </Link>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">🖼️</span>
                <Badge className="bg-gradient-to-r from-red-600 to-green-600 text-white border-0">
                  <ShoppingBag className="h-3 w-3 mr-1" /> {products?.length || 0} Producten
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                Kerst Posters & Art Prints
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6">
                Breng de magie van kerstmuziek in je interieur met onze unieke art prints. 
                Van klassieke kerstliedjes tot moderne hits, geïnspireerd door iconische album artwork.
              </p>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="border-red-500/50 text-red-500">
                  <Image className="h-3 w-3 mr-1" />
                  Posters €49,95
                </Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Canvas €79,95
                </Badge>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                  <Image className="h-3 w-3 mr-1" />
                  Metal Print €89,95
                </Badge>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filter & Grid */}
        <section className="container mx-auto px-4 pb-20">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-8">
            <TabsList className="bg-card/80 backdrop-blur-sm">
              <TabsTrigger value="all">Alle ({counts.all})</TabsTrigger>
              <TabsTrigger value="poster">Posters ({counts.poster})</TabsTrigger>
              <TabsTrigger value="canvas">Canvas ({counts.canvas})</TabsTrigger>
              <TabsTrigger value="metal-print">Metal Print ({counts['metal-print']})</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Image className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nog geen producten</h3>
              <p className="text-muted-foreground mb-6">
                Kerst art prints worden binnenkort toegevoegd!
              </p>
              <Link to="/shop">
                <Button variant="outline">
                  Bekijk alle art prints
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProducts.length} kerst art {filteredProducts.length === 1 ? 'print' : 'prints'} gevonden
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  >
                    <Link to={`/product/${product.slug}`}>
                      <div className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-red-500/50">
                        {/* Image section */}
                        <div className="relative aspect-[3/4] bg-muted">
                          <img
                            src={product.primary_image || '/placeholder.svg'}
                            alt={product.title}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-red-600 text-white border-0 text-xs">
                              🎄 Kerst
                            </Badge>
                          </div>
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
                          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-red-600 transition-colors">
                            {product.artist || 'Kerst Collectie'}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{product.title}</p>
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-lg font-bold text-primary">
                              €{getProductPrice(product.media_type, product.price).toFixed(2).replace('.', ',')}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-red-600 group-hover:text-red-700">
                              <span>Bekijk</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Related Sections */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>🎁</span>
              Meer Kerst Collecties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/kerst-singles">
                <div className="p-6 bg-card rounded-xl border border-border/50 hover:border-green-500/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎵</span>
                      <div>
                        <h3 className="font-semibold group-hover:text-green-600">Kerst Singles</h3>
                        <p className="text-sm text-muted-foreground">Verhalen achter de hits</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
              <Link to="/kerst/anekdotes">
                <div className="p-6 bg-card rounded-xl border border-border/50 hover:border-red-500/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📖</span>
                      <div>
                        <h3 className="font-semibold group-hover:text-red-600">Kerst Anekdotes</h3>
                        <p className="text-sm text-muted-foreground">Leuke kerst weetjes</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-red-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
              <Link to="/shop?category=socks">
                <div className="p-6 bg-card rounded-xl border border-border/50 hover:border-yellow-500/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🧦</span>
                      <div>
                        <h3 className="font-semibold group-hover:text-yellow-600">Kerst Sokken</h3>
                        <p className="text-sm text-muted-foreground">Premium merino wol</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-yellow-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
