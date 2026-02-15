import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ShoppingBag, 
  Shirt, 
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  CircleDot,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Category configuration with DB filters - uses translation keys
const useCategoryConfig = () => {
  const { tr } = useLanguage();
  return [
    { key: "posters", label: tr.nav.posters, icon: ImageIcon, description: tr.shop.postersDescription, link: "/posters", gradient: "from-pink-500/20 to-rose-500/20", dbFilter: "POSTER" },
    { key: "canvas", label: tr.nav.canvasArt, icon: ImageIcon, description: tr.shop.canvasDescription, link: "/canvas", gradient: "from-purple-500/20 to-indigo-500/20", dbFilter: "CANVAS" },
    { key: "metal", label: tr.nav.metalPrints, icon: ImageIcon, description: tr.shop.metalDescription, link: "/metal-prints", gradient: "from-slate-500/20 to-zinc-500/20", dbFilter: "metaalprint" },
    { key: "clothing", label: tr.shop.clothing, icon: Shirt, description: tr.shop.clothingDescription, link: "/merchandise", gradient: "from-green-500/20 to-emerald-500/20", dbFilter: "merchandise" },
  ];
};

type ShopProduct = {
  id: string;
  title: string;
  artist?: string;
  price: number;
  image?: string;
  slug?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

const useCategoryProducts = (categoryKey: string, dbFilter: string) => {
  return useQuery({
    queryKey: ['shop-category', categoryKey],
    queryFn: async () => {
      let query = supabase
        .from('platform_products')
        .select('id, title, artist, price, images, primary_image, slug, tags, metadata')
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .or('stock_quantity.gt.0,allow_backorder.eq.true');
      
      if (categoryKey === 'clothing') {
        query = query.contains('categories', ['tshirts']);
      } else {
        query = query.contains('categories', [dbFilter]);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        artist: p.artist || undefined,
        price: p.price,
        image: p.primary_image || p.images?.[0] || undefined,
        slug: p.slug,
        tags: p.tags || [],
        metadata: (p.metadata as Record<string, unknown>) || {},
      })) as ShopProduct[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

const useCategoryCounts = () => {
  return useQuery({
    queryKey: ['shop-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shop_category_counts');
      if (error) {
        return { posters: 64, canvas: 24, metal: 6655, clothing: 56, accessories: 8 };
      }
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { tr } = useLanguage();
  const sh = tr.shop;
  const CATEGORIES = useCategoryConfig();

  const postersQuery = useCategoryProducts('posters', CATEGORIES.find(c => c.key === 'posters')!.dbFilter);
  const canvasQuery = useCategoryProducts('canvas', CATEGORIES.find(c => c.key === 'canvas')!.dbFilter);
  const metalQuery = useCategoryProducts('metal', CATEGORIES.find(c => c.key === 'metal')!.dbFilter);
  const clothingQuery = useCategoryProducts('clothing', CATEGORIES.find(c => c.key === 'clothing')!.dbFilter);
  const countsQuery = useCategoryCounts();

  const isLoading = postersQuery.isLoading || canvasQuery.isLoading || metalQuery.isLoading || clothingQuery.isLoading;

  const productsByCategory: Record<string, ShopProduct[]> = {
    posters: postersQuery.data || [],
    canvas: canvasQuery.data || [],
    metal: metalQuery.data || [],
    clothing: clothingQuery.data || [],
  };

  const getFilteredProducts = (products: ShopProduct[]) => {
    let filtered = products;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.artist?.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => {
      const aIsVector = a.tags?.some(tag => tag.toLowerCase().includes('vector'));
      const bIsVector = b.tags?.some(tag => tag.toLowerCase().includes('vector'));
      if (aIsVector && !bIsVector) return -1;
      if (!aIsVector && bIsVector) return 1;
      return 0;
    });
  };

  const counts: Record<string, number> = (countsQuery.data as Record<string, number>) || { posters: 0, canvas: 0, metal: 0, clothing: 0 };
  const totalProducts = Object.values(counts).reduce((a, b) => a + b, 0);

  const allDisplayProducts = [...(productsByCategory.posters || []), ...(productsByCategory.canvas || []), 
    ...(productsByCategory.metal || []).slice(0, 10), ...(productsByCategory.clothing || [])];
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: sh.metaTitle,
    description: sh.metaDescription,
    url: "https://www.musicscan.app/shop",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalProducts,
      itemListElement: allDisplayProducts.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.title,
          image: product.image,
          offers: { "@type": "Offer", price: product.price, priceCurrency: "EUR", availability: "https://schema.org/InStock" }
        }
      }))
    }
  };

  const getProductLink = (product: ShopProduct) => product.slug ? `/product/${product.slug}` : `/shop`;

  const ProductCard = ({ product, index, categoryKey }: { product: ShopProduct; index: number; categoryKey: string }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={getProductLink(product)}>
        <Card className="group overflow-hidden h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
          <div className="aspect-square relative overflow-hidden bg-muted">
            {product.image ? (
              <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-4 h-4" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <span className="text-white text-sm font-medium flex items-center gap-1">{tr.common.view} <ArrowRight className="w-4 h-4" /></span>
            </div>
          </div>
          <CardContent className="p-3">
            {product.artist && <p className="text-xs text-muted-foreground truncate mb-0.5">{product.artist}</p>}
            <h3 className="text-sm font-semibold truncate mb-1 group-hover:text-primary transition-colors">{product.title}</h3>
            <p className="text-base font-bold text-primary">€{product.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  const CategorySection = ({ category }: { category: typeof CATEGORIES[0] }) => {
    const products = getFilteredProducts(productsByCategory[category.key] || []);
    const displayProducts = products.slice(0, 8);
    const categoryCount = (counts as Record<string, number>)[category.key] || products.length;
    const hasMore = categoryCount > 8;
    const Icon = category.icon;

    if (products.length === 0) return null;

    return (
      <section className="mb-12">
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${category.gradient} border border-border/30 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm"><Icon className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-2xl font-bold">{category.label}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {displayProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} categoryKey={category.key} />
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Link to={category.link}>
              <Button variant="outline" className="gap-2">{tr.common.viewAll} <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      <Helmet>
        <title>{sh.metaTitle}</title>
        <meta name="description" content={sh.metaDescription} />
        <meta name="keywords" content="muziek merchandise, band shirts, muziek posters, canvas art, metal prints, muziek shop" />
        <link rel="canonical" href="https://www.musicscan.app/shop" />
        <meta property="og:title" content={sh.title} />
        <meta property="og:description" content={sh.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.musicscan.app/shop" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="container mx-auto px-4 py-6 md:py-14 relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-2 border-primary/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {totalProducts} {tr.common.products}
              </Badge>
              <h1 className="text-2xl md:text-5xl font-bold tracking-tight mb-2 md:mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {sh.title}
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-8 max-w-2xl mx-auto">{sh.subtitle}</p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={sh.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-4 md:py-6 text-sm md:text-lg rounded-full border-2 border-border/50 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 mt-4 md:mt-8 max-w-md sm:max-w-none mx-auto">
              {CATEGORIES.map((cat) => {
                const count = (counts as Record<string, number>)[cat.key] || 0;
                if (count === 0) return null;
                return (
                  <Link key={cat.key} to={cat.link} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-sm">
                    <cat.icon className="w-3.5 h-3.5" />
                    <span className="font-medium text-xs">{cat.label}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-24 w-full rounded-2xl mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Card key={j} className="overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
                        <CardContent className="p-3">
                          <Skeleton className="h-3 w-2/3 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {CATEGORIES.map((category) => (
                <CategorySection key={category.key} category={category} />
              ))}

              {totalProducts === 0 && (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{sh.noProducts}</h3>
                  <p className="text-muted-foreground">{sh.noProductsDesc}</p>
                </div>
              )}

              {searchQuery && allDisplayProducts.length === 0 && totalProducts > 0 && (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{sh.noResultsFor} "{searchQuery}"</h3>
                  <p className="text-muted-foreground mb-4">{tr.common.tryOtherTerms}</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>{tr.common.clearSearch}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Shop;
