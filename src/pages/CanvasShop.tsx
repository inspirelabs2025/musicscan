import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { usePlatformProductCounts } from "@/hooks/usePlatformProductCounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, Eye, Frame } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CanvasShop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "popular">("newest");
  const [showFeatured, setShowFeatured] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const { tr } = useLanguage();
  const sp = tr.shopPageUI;

  const { data: canvasProducts, isLoading } = usePlatformProducts({ 
    mediaType: 'art',
    categoryContains: 'CANVAS',
    featured: showFeatured || undefined,
    onSale: showOnSale || undefined,
  });

  const { data: productCounts } = usePlatformProductCounts();

  const filteredProducts = canvasProducts
    ?.filter(product => {
      if (!searchQuery) return true;
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const searchableText = `${product.artist || ''} ${product.title || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "popular": return b.view_count - a.view_count;
        case "newest":
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const featuredCount = canvasProducts?.filter(p => p.is_featured).length || 0;
  const onSaleCount = canvasProducts?.filter(p => p.is_on_sale).length || 0;
  const avgPrice = canvasProducts?.length 
    ? Math.round(canvasProducts.reduce((sum, p) => sum + p.price, 0) / canvasProducts.length) 
    : 0;

  return (
    <>
      <Helmet>
        <title>Premium Canvas Doeken - Warm Grayscale Kunst Canvas | VinylScout</title>
        <meta name="description" content="Ontdek unieke canvas doeken met elegante warm grayscale stijl. Zwart-wit met subtiele bruine en beige tonen. Premium canvas kwaliteit, gallery-wrapped. Gratis verzending vanaf €50." />
        <meta name="keywords" content="canvas doeken, warm grayscale canvas, zwart wit canvas, kunst canvas, gallery wrap canvas, albumcover canvas, wanddecoratie canvas, premium canvas prints" />
        <meta property="og:title" content="Premium Canvas Doeken - Warm Grayscale Kunst" />
        <meta property="og:description" content="Elegante canvas doeken met warm grayscale stijl. Museum-kwaliteit canvas voor aan de muur." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Premium Canvas Doeken",
            "description": "Unieke canvas doeken met warm grayscale stijl",
            "url": "https://www.musicscan.app/canvas",
            "numberOfItems": canvasProducts?.length || 0,
            "about": { "@type": "Thing", "name": "Canvas Art" }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10">
        <div className="container py-4 md:py-8 space-y-4">
          <BreadcrumbNavigation items={[
            { name: "Home", url: "/" },
            { name: sp.canvasDoeken, url: "/canvas" }
          ]} />

          <CategoryNavigation
            currentCategory="canvas"
            metalPrintsCount={productCounts?.metalPrintsCount || 0}
            postersCount={productCounts?.postersCount || 0}
            canvasCount={productCounts?.canvasCount || 0}
            metalPrintsMinPrice={productCounts?.metalPrintsMinPrice || 0}
            postersMinPrice={productCounts?.postersMinPrice || 0}
            canvasMinPrice={productCounts?.canvasMinPrice || 0}
          />

          {/* Hero */}
          <div className="hidden md:block relative overflow-hidden rounded-2xl p-12 text-white" style={{ background: 'linear-gradient(to bottom right, hsl(30, 20%, 25%), hsl(30, 40%, 20%))' }}>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Frame className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">Premium Canvas</span>
              </div>
              <h1 className="text-5xl font-bold">{sp.canvasHeroTitle}</h1>
              <p className="text-xl text-white/90 max-w-2xl">{sp.canvasHeroSubtitle}</p>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{productCounts?.canvasCount || 0}</div>
                  <div className="text-sm text-white/80">{sp.canvasDoeken}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">€{avgPrice}</div>
                  <div className="text-sm text-white/80">{sp.avgPrice}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{featuredCount}</div>
                  <div className="text-sm text-white/80">{sp.featured}</div>
                </div>
                {onSaleCount > 0 && (
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{onSaleCount}</div>
                    <div className="text-sm text-white/80">{sp.onSale}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={sp.searchArtistAlbumStyle} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full lg:w-[200px]"><SelectValue placeholder={sp.sortPlaceholder} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{sp.newestFirst}</SelectItem>
                    <SelectItem value="price-asc">{sp.priceLowHigh}</SelectItem>
                    <SelectItem value="price-desc">{sp.priceHighLow}</SelectItem>
                    <SelectItem value="popular">{sp.mostPopular}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant={showFeatured ? "default" : "outline"} size="sm" onClick={() => setShowFeatured(!showFeatured)}>
                    <Sparkles className="h-4 w-4 mr-2" />{sp.featured}
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
                  <CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-6 w-20" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary h-full">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img src={product.primary_image || product.images[0] || '/placeholder.svg'} alt={`${product.artist} - ${product.title} canvas`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.is_featured && (<Badge className="bg-vinyl-gold text-black font-bold"><Sparkles className="h-3 w-3 mr-1" />{sp.featured}</Badge>)}
                        {product.is_on_sale && (<Badge variant="destructive" className="font-bold">{sp.sale}</Badge>)}
                        {product.is_new && (<Badge variant="secondary" className="font-bold">{sp.newBadge}</Badge>)}
                        <Badge variant="outline" className="bg-black/60 text-white border-white/20">🖤 Warm Grayscale</Badge>
                      </div>
                      <div className="absolute bottom-3 right-3"><Badge variant="secondary" className="bg-black/60 text-white border-0"><Eye className="h-3 w-3 mr-1" />{product.view_count}</Badge></div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-medium">{product.artist || 'Various Artists'}</p>
                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                      </div>
                      {product.description && (<p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>)}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                      <div className="space-y-1">
                        {product.is_on_sale && product.compare_at_price && (<p className="text-sm text-muted-foreground line-through">€{product.compare_at_price.toFixed(2)}</p>)}
                        <p className="text-2xl font-bold text-vinyl-gold">€{product.price.toFixed(2)}</p>
                      </div>
                      <Button variant="outline" size="sm">{sp.view}</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-4xl">🖼️</div>
                <h3 className="text-xl font-bold">{sp.noCanvasFound}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? sp.noResultsFor.replace('{query}', searchQuery) : sp.noCanvasAvailable}
                </p>
                {searchQuery && (<Button onClick={() => setSearchQuery("")} variant="outline">{sp.clearFilters}</Button>)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
