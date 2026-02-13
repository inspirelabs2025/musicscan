import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, Eye, Gift } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";

export default function MerchandiseShop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "popular">("newest");
  const [showFeatured, setShowFeatured] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "tshirts">("all");

  const { data: allProducts, isLoading } = usePlatformProducts({ 
    mediaType: 'merchandise',
    featured: showFeatured || undefined,
  });

  // Separate T-shirts (socks hidden from assortment)
  const tshirtProducts = allProducts?.filter(product => 
    product.categories?.includes('tshirts')
  );

  // Filter based on active tab
  const tabFilteredProducts = activeTab === "all" 
    ? tshirtProducts 
    : tshirtProducts;

  // Filter and sort products
  const filteredProducts = tabFilteredProducts
    ?.filter(product => {
      if (!searchQuery) return true;
      
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const searchableText = `${product.artist || ''} ${product.title || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "popular":
          return b.view_count - a.view_count;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const featuredCount = allProducts?.filter(p => p.is_featured).length || 0;
  const avgPrice = allProducts?.length 
    ? Math.round(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length) 
    : 0;

  return (
    <>
      <Helmet>
        <title>Merchandise - T-Shirts | VinylScout</title>
        <meta name="description" content="Draag je favoriete muziek met stijl. Premium T-shirts met iconische album artwork. Verkrijgbaar in diverse maten en stijlen." />
        <meta name="keywords" content="muziek merchandise, band t-shirts, album sokken, muziek kleding, merchandise, music fashion" />
        <meta property="og:title" content="Merchandise - T-Shirts" />
        <meta property="og:description" content="Premium T-shirts geïnspireerd op iconische albums." />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Merchandise Collectie",
            "description": "T-Shirts geïnspireerd op iconische albums",
            "url": "https://www.musicscan.app/merchandise",
            "numberOfItems": allProducts?.length || 0,
            "about": {
              "@type": "Thing",
              "name": "Music Merchandise"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-50/30 dark:to-pink-950/20">
        <div className="container py-4 md:py-8 space-y-4">
          <BreadcrumbNavigation items={[
            { name: "Home", url: "/" },
            { name: "Merchandise Shop", url: "/merchandise" }
          ]} />

          {/* Hero Header - hidden on mobile for compact layout */}
          <div className="hidden md:block relative overflow-hidden rounded-2xl p-12 text-white" style={{ background: 'linear-gradient(to bottom right, hsl(330, 80%, 55%), hsl(270, 70%, 50%), hsl(30, 90%, 55%))' }}>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">Music Fashion</span>
              </div>
              <h1 className="text-5xl font-bold">
                🎁 Merchandise Collectie
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Draag je favoriete muziek met stijl. Premium T-shirts met iconische album artwork.
              </p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{tshirtProducts?.length || 0}</div>
                  <div className="text-sm text-white/80">T-Shirts</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">€{avgPrice}</div>
                  <div className="text-sm text-white/80">Gem. Prijs</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">7</div>
                  <div className="text-sm text-white/80">Style Variants</div>
                </div>
                {featuredCount > 0 && (
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{featuredCount}</div>
                    <div className="text-sm text-white/80">Featured</div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-900/50 border-pink-200 dark:border-pink-800">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  👕 Premium T-Shirts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Premium cotton T-shirts met all-over designs. Comfortabel en duurzaam.
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-primary">€24,95</p>
                  <span className="text-sm text-muted-foreground">S t/m XXL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                Alle T-Shirts ({tshirtProducts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tshirts">
                Nieuwste Designs
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op artiest of album..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Sorteer op..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nieuwste eerst</SelectItem>
                    <SelectItem value="price-asc">Prijs: Laag - Hoog</SelectItem>
                    <SelectItem value="price-desc">Prijs: Hoog - Laag</SelectItem>
                    <SelectItem value="popular">Meest populair</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter Toggles */}
                <div className="flex gap-2">
                  <Button
                    variant={showFeatured ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFeatured(!showFeatured)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Featured
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isTshirt = product.categories?.includes('tshirts');
                
                return (
                  <Link key={product.id} to={`/product/${product.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary h-full">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={product.primary_image || product.images[0] || '/placeholder.svg'}
                          alt={`${product.artist} - ${product.title}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {isTshirt && (
                            <Badge className="bg-blue-600 text-white font-bold">
                              👕 T-Shirt
                            </Badge>
                          )}
                          {product.is_featured && (
                            <Badge className="bg-vinyl-gold text-black font-bold">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>

                        {/* Size Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="bg-black/60 text-white border-0">
                            S-XXL
                          </Badge>
                        </div>

                        {/* View Count */}
                        <div className="absolute bottom-3 right-3">
                          <Badge variant="secondary" className="bg-black/60 text-white border-0">
                            <Eye className="h-3 w-3 mr-1" />
                            {product.view_count}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-medium">
                            {product.artist || 'Various Artists'}
                          </p>
                          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {product.title}
                          </h3>
                        </div>

                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description.split('\n')[0]}
                          </p>
                        )}
                      </CardContent>

                      {/* Footer */}
                      <CardFooter className="p-4 pt-0 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-primary">
                            €{product.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Premium Cotton
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Bekijk
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-4xl">🎁</div>
                <h3 className="text-xl font-bold">Geen merchandise gevonden</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `Geen resultaten voor "${searchQuery}". Probeer een andere zoekopdracht.`
                    : "Er zijn momenteel geen merchandise items beschikbaar."}
                </p>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery("")} variant="outline">
                    Wis filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
