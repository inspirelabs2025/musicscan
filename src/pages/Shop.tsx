import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { usePublicMarketplace } from "@/hooks/usePublicMarketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Disc, 
  Shirt, 
  Image as ImageIcon,
  Music,
  ArrowRight,
  Sparkles,
  Grid3X3,
  LayoutGrid
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "newest" | "price-low" | "price-high" | "title";
type CategoryFilter = "all" | "vinyl" | "cd" | "art" | "clothing" | "accessories";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  const { data: platformProducts = [], isLoading: platformLoading } = usePlatformProducts();
  const { items: marketplaceItems = [], isLoading: marketplaceLoading } = usePublicMarketplace();

  const isLoading = platformLoading || marketplaceLoading;

  // Combine all products into unified format
  const allProducts = useMemo(() => {
    const products: Array<{
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
    }> = [];

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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.artist?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => {
        switch (categoryFilter) {
          case "vinyl":
            return p.mediaType === "vinyl" || p.category === "vinyl";
          case "cd":
            return p.mediaType === "cd" || p.category === "cd";
          case "art":
            return ["art", "poster", "canvas", "print"].includes(p.category);
          case "clothing":
            return ["clothing", "tshirt", "shirt", "socks"].includes(p.category);
          case "accessories":
            return ["accessories", "button", "badge", "merch"].includes(p.category);
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [allProducts, searchQuery, categoryFilter, sortBy]);

  // Stats for display
  const stats = useMemo(() => ({
    total: allProducts.length,
    vinyl: allProducts.filter(p => p.mediaType === "vinyl" || p.category === "vinyl").length,
    cd: allProducts.filter(p => p.mediaType === "cd" || p.category === "cd").length,
    art: allProducts.filter(p => ["art", "poster", "canvas", "print"].includes(p.category)).length,
    clothing: allProducts.filter(p => ["clothing", "tshirt", "shirt", "socks"].includes(p.category)).length,
  }), [allProducts]);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MusicScan Shop - Muziek Merchandise & Vinyl",
    description: "Ontdek unieke muziek merchandise, vinyl platen, CD's, posters en meer. Shop bij MusicScan voor muziekliefhebbers.",
    url: "https://musicscan.nl/shop",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 20).map((product, index) => ({
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
        return <ImageIcon className="w-4 h-4" />;
      case "clothing":
      case "tshirt":
      case "socks":
        return <Shirt className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getProductLink = (product: typeof filteredProducts[0]) => {
    if (product.type === "platform" && product.slug) {
      return `/product/${product.slug}`;
    }
    return `/marketplace`;
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
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Badge variant="outline" className="mb-4 border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {stats.total} producten beschikbaar
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                MusicScan Shop
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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

            {/* Quick Category Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 mt-10"
            >
              {[
                { key: "vinyl", label: "Vinyl", count: stats.vinyl, icon: Disc },
                { key: "cd", label: "CD's", count: stats.cd, icon: Music },
                { key: "art", label: "Art Prints", count: stats.art, icon: ImageIcon },
                { key: "clothing", label: "Kleding", count: stats.clothing, icon: Shirt },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(categoryFilter === cat.key ? "all" : cat.key as CategoryFilter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    categoryFilter === cat.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-xs opacity-70">({cat.count})</span>
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Filters & Products */}
        <section className="container mx-auto px-4 py-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} resultaten
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sorteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nieuwste eerst</SelectItem>
                  <SelectItem value="price-low">Prijs: laag-hoog</SelectItem>
                  <SelectItem value="price-high">Prijs: hoog-laag</SelectItem>
                  <SelectItem value="title">Titel A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`p-2 ${viewMode === "compact" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"}`}>
              {Array.from({ length: 20 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-5 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && (
            <AnimatePresence mode="popLayout">
              {filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Geen producten gevonden</h3>
                  <p className="text-muted-foreground mb-4">
                    Probeer andere zoektermen of filters
                  </p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}>
                    Reset filters
                  </Button>
                </motion.div>
              ) : (
                <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"}`}>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={`${product.type}-${product.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Link to={getProductLink(product)}>
                        <Card className="group overflow-hidden h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
                          {/* Image */}
                          <div className="aspect-square relative overflow-hidden bg-muted">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getCategoryIcon(product.category)}
                              </div>
                            )}
                            
                            {/* Category Badge */}
                            <Badge 
                              className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-foreground border-0"
                            >
                              {getCategoryIcon(product.category)}
                              <span className="ml-1 capitalize">{product.mediaType || product.category}</span>
                            </Badge>

                            {/* Condition Badge for marketplace items */}
                            {product.condition && (
                              <Badge 
                                variant="secondary"
                                className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm"
                              >
                                {product.condition}
                              </Badge>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                              <span className="text-white text-sm font-medium flex items-center gap-1">
                                Bekijk <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <CardContent className={viewMode === "grid" ? "p-4" : "p-3"}>
                            {product.artist && (
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                {product.artist}
                              </p>
                            )}
                            <h3 className={`font-semibold truncate mb-2 group-hover:text-primary transition-colors ${viewMode === "grid" ? "text-sm" : "text-xs"}`}>
                              {product.title}
                            </h3>
                            <p className={`font-bold text-primary ${viewMode === "grid" ? "text-lg" : "text-sm"}`}>
                              €{product.price.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>
    </>
  );
};

export default Shop;
