import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { usePublicMarketplace } from "@/hooks/usePublicMarketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ShoppingBag, 
  Disc, 
  Shirt, 
  Image as ImageIcon,
  Music,
  ArrowRight,
  Sparkles,
  CircleDot,
  ChevronRight
} from "lucide-react";

// Category configuration
const CATEGORIES = [
  { 
    key: "vinyl", 
    label: "Vinyl Platen", 
    icon: Disc, 
    description: "Tweedehands vinyl uit collecties",
    link: "/marketplace?filter=vinyl",
    gradient: "from-orange-500/20 to-red-500/20"
  },
  { 
    key: "cd", 
    label: "CD's", 
    icon: Music, 
    description: "Tweedehands CD's uit collecties",
    link: "/marketplace?filter=cd",
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  { 
    key: "art", 
    label: "Art Prints & Posters", 
    icon: ImageIcon, 
    description: "Album covers als kunstwerk",
    link: "/art-shop",
    gradient: "from-pink-500/20 to-rose-500/20"
  },
  { 
    key: "clothing", 
    label: "Kleding", 
    icon: Shirt, 
    description: "T-shirts & sokken met album art",
    link: "/merchandise",
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  { 
    key: "accessories", 
    label: "Buttons & Badges", 
    icon: CircleDot, 
    description: "Muziek buttons en pins",
    link: "/buttons",
    gradient: "from-yellow-500/20 to-amber-500/20"
  },
];

type UnifiedProduct = {
  id: string;
  type: "platform" | "marketplace";
  title: string;
  artist?: string;
  price: number;
  image?: string;
  category: string;
  mediaType?: string;
  slug?: string;
  createdAt: string;
  condition?: string;
};

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: platformProducts = [], isLoading: platformLoading } = usePlatformProducts();
  const { items: marketplaceItems = [], isLoading: marketplaceLoading } = usePublicMarketplace();

  const isLoading = platformLoading || marketplaceLoading;

  // Combine all products into unified format
  const allProducts = useMemo(() => {
    const products: UnifiedProduct[] = [];

    // Add platform products
    platformProducts.forEach((p) => {
      const category = p.categories?.[0] || "other";
      products.push({
        id: p.id,
        type: "platform",
        title: p.title,
        artist: p.artist || undefined,
        price: p.price,
        image: p.images?.[0] || p.primary_image || undefined,
        category,
        mediaType: p.media_type || category,
        slug: p.slug,
        createdAt: p.created_at,
      });
    });

    // Add marketplace items (vinyl/cd for sale)
    marketplaceItems.forEach((item) => {
      products.push({
        id: item.id,
        type: "marketplace",
        title: item.title || "Untitled",
        artist: item.artist || undefined,
        price: item.marketplace_price || 0,
        image: item.front_image,
        category: item.media_type === "vinyl" ? "vinyl" : "cd",
        mediaType: item.media_type,
        slug: undefined,
        createdAt: item.created_at,
        condition: item.condition_grade,
      });
    });

    return products;
  }, [platformProducts, marketplaceItems]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.artist?.toLowerCase().includes(query)
    );
  }, [allProducts, searchQuery]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, UnifiedProduct[]> = {};
    
    CATEGORIES.forEach(cat => {
      grouped[cat.key] = filteredProducts.filter((p) => {
        switch (cat.key) {
          case "vinyl":
            return p.mediaType === "vinyl" || p.category === "vinyl";
          case "cd":
            return p.mediaType === "cd" || p.category === "cd";
          case "art":
            return ["art", "poster", "canvas", "print", "metal-print"].includes(p.category);
          case "clothing":
            return ["clothing", "tshirt", "shirt", "socks", "t-shirt"].includes(p.category);
          case "accessories":
            return ["accessories", "button", "badge", "merch", "buttons"].includes(p.category);
          default:
            return false;
        }
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    return grouped;
  }, [filteredProducts]);

  // Stats for display
  const stats = useMemo(() => ({
    total: allProducts.length,
    vinyl: productsByCategory.vinyl?.length || 0,
    cd: productsByCategory.cd?.length || 0,
    art: productsByCategory.art?.length || 0,
    clothing: productsByCategory.clothing?.length || 0,
    accessories: productsByCategory.accessories?.length || 0,
  }), [allProducts, productsByCategory]);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MusicScan Shop - Muziek Merchandise & Vinyl",
    description: "Ontdek unieke muziek merchandise, vinyl platen, CD's, posters en meer. Shop bij MusicScan voor muziekliefhebbers.",
    url: "https://musicscan.nl/shop",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allProducts.length,
      itemListElement: allProducts.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.title,
          image: product.image,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          }
        }
      }))
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "vinyl":
        return <Disc className="w-4 h-4" />;
      case "cd":
        return <Music className="w-4 h-4" />;
      case "art":
      case "poster":
      case "canvas":
      case "metal-print":
        return <ImageIcon className="w-4 h-4" />;
      case "clothing":
      case "tshirt":
      case "socks":
      case "t-shirt":
        return <Shirt className="w-4 h-4" />;
      case "buttons":
      case "button":
      case "badge":
        return <CircleDot className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getProductLink = (product: UnifiedProduct) => {
    if (product.type === "platform" && product.slug) {
      return `/product/${product.slug}`;
    }
    return `/marketplace`;
  };

  // Product Card Component
  const ProductCard = ({ product, index }: { product: UnifiedProduct; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={getProductLink(product)}>
        <Card className="group overflow-hidden h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
          <div className="aspect-square relative overflow-hidden bg-muted">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {getCategoryIcon(product.category)}
              </div>
            )}
            
            {product.condition && (
              <Badge 
                variant="secondary"
                className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm"
              >
                {product.condition}
              </Badge>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <span className="text-white text-sm font-medium flex items-center gap-1">
                Bekijk <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          <CardContent className="p-3">
            {product.artist && (
              <p className="text-xs text-muted-foreground truncate mb-0.5">
                {product.artist}
              </p>
            )}
            <h3 className="text-sm font-semibold truncate mb-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <p className="text-base font-bold text-primary">
              €{product.price.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  // Category Section Component
  const CategorySection = ({ category }: { category: typeof CATEGORIES[0] }) => {
    const products = productsByCategory[category.key] || [];
    const displayProducts = products.slice(0, 6);
    const hasMore = products.length > 6;
    const Icon = category.icon;

    if (products.length === 0) return null;

    return (
      <section className="mb-12">
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${category.gradient} border border-border/30 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{category.label}</h2>
                <p className="text-muted-foreground">{category.description} • {products.length} items</p>
              </div>
            </div>
            {hasMore && (
              <Link to={category.link}>
                <Button variant="outline" className="gap-2">
                  Bekijk alle
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayProducts.map((product, index) => (
            <ProductCard key={`${product.type}-${product.id}`} product={product} index={index} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <>
      <Helmet>
        <title>Shop - Muziek Merchandise, Vinyl & CD's | MusicScan</title>
        <meta 
          name="description" 
          content="Ontdek unieke muziek merchandise, vinyl platen, CD's, art prints, t-shirts en meer. De beste shop voor muziekliefhebbers met duizenden producten." 
        />
        <meta name="keywords" content="vinyl kopen, cd kopen, muziek merchandise, band shirts, muziek posters, platenwinkel, muziek shop" />
        <link rel="canonical" href="https://musicscan.nl/shop" />
        <meta property="og:title" content="MusicScan Shop - Muziek Merchandise & Vinyl" />
        <meta property="og:description" content="Ontdek unieke muziek merchandise, vinyl platen, CD's en meer bij MusicScan." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://musicscan.nl/shop" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="container mx-auto px-4 py-12 md:py-20 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Badge variant="outline" className="mb-4 border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {stats.total} producten beschikbaar
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                MusicScan Shop
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Vinyl, CD's, art prints, merchandise en meer. 
                Alles voor de echte muziekliefhebber.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Zoek op artiest, album of product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-border/50 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3 mt-8"
            >
              {CATEGORIES.map((cat) => {
                const count = stats[cat.key as keyof typeof stats] || 0;
                if (count === 0) return null;
                return (
                  <Link
                    key={cat.key}
                    to={cat.link}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="font-medium">{cat.label}</span>
                    <span className="text-xs opacity-70">({count})</span>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Category Sections */}
        <div className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-24 w-full rounded-2xl mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
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

              {/* Empty State */}
              {allProducts.length === 0 && (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nog geen producten</h3>
                  <p className="text-muted-foreground">
                    Er zijn momenteel geen producten beschikbaar.
                  </p>
                </div>
              )}

              {/* Search Empty State */}
              {searchQuery && filteredProducts.length === 0 && allProducts.length > 0 && (
                <div className="text-center py-20">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Geen resultaten voor "{searchQuery}"</h3>
                  <p className="text-muted-foreground mb-4">
                    Probeer andere zoektermen
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Wis zoekopdracht
                  </Button>
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
