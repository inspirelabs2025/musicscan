import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, ShoppingCart, Pin } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { generateButtonAltTag } from "@/utils/generateAltTag";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ButtonsShop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "popular">("newest");
  const [showFeatured, setShowFeatured] = useState(false);
  const { tr } = useLanguage();
  const s = tr.shopUI;

  const { data: allProducts, isLoading } = usePlatformProducts({ 
    mediaType: 'merchandise',
    featured: showFeatured || undefined,
  });

  const buttonProducts = allProducts?.filter(product => 
    product.categories?.includes('buttons') || product.categories?.includes('badges')
  );

  const filteredProducts = buttonProducts
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

  const featuredCount = buttonProducts?.filter(p => p.is_featured).length || 0;
  const avgPrice = buttonProducts?.length 
    ? Math.round(buttonProducts.reduce((sum, p) => sum + p.price, 0) / buttonProducts.length * 100) / 100
    : 0;

  return (
    <>
      <Helmet>
        <title>Artist Buttons & Badges - Muziek Speldjes | VinylScout</title>
        <meta name="description" content="Draag je favoriete artiesten met stijl! Unieke buttons en badges met iconische muzikanten. Formaat 3.5-4cm, vanaf €4,50. Shop nu!" />
        <meta name="keywords" content="artist buttons, muziek badges, band speldjes, merchandise, music pins, buttons kopen, badge collection" />
        <meta property="og:title" content="Artist Buttons - Muziek Speldjes" />
        <meta property="og:description" content="Unieke artist buttons vanaf €4,50. Speld je favoriete muziek!" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.musicscan.app/buttons" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Artist Buttons Collectie",
            "description": "Buttons en badges met iconische muziekartisten",
            "url": "https://www.musicscan.app/buttons",
            "numberOfItems": buttonProducts?.length || 0,
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "EUR",
              "lowPrice": "4.50",
              "highPrice": avgPrice.toString()
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/20">
        <div className="container py-4 md:py-8 space-y-4">
          <BreadcrumbNavigation items={[
            { name: "Home", url: "/" },
            { name: "Buttons Shop", url: "/buttons" }
          ]} />

          {/* Hero Section - hidden on mobile */}
          <div className="hidden md:block relative overflow-hidden rounded-2xl p-12 text-white" style={{ background: 'linear-gradient(to right, hsl(220, 80%, 50%), hsl(270, 70%, 50%), hsl(330, 80%, 50%))' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Pin className="h-12 w-12" />
                  <h1 className="text-5xl font-bold">Artist Buttons</h1>
                </div>
                <p className="text-xl mb-6 text-blue-50">
                  {s.pinArtist}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    📌 {buttonProducts?.length || 0} {s.buttonsCount}
                  </Badge>
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    💰 {s.from} €4,50
                  </Badge>
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    📏 3.5cm - 4cm
                  </Badge>
                </div>
              </div>
              
              {/* Visual Size Examples */}
              <div className="relative z-10 flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="relative mx-auto mb-3">
                    <div className="w-[140px] h-[140px] rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center font-bold text-2xl shadow-2xl" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <Pin className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Pin className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white/90">3.5cm</p>
                  <p className="text-xs text-white/70">{s.compact}</p>
                </div>
                
                <div className="text-center">
                  <div className="relative mx-auto mb-3">
                    <div className="w-[160px] h-[160px] rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center font-bold text-2xl shadow-2xl" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                        <Pin className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Pin className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white/90">4cm</p>
                  <p className="text-xs text-white/70">{s.standard}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* Size Info Banner */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs md:text-sm font-bold">
                3.5
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs md:text-sm">3.5cm - {s.compact}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{s.capsAndBags}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <div className="w-9 h-9 md:w-11 md:h-11 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs md:text-sm font-bold">
                4
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs md:text-sm">4cm - {s.standard}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{s.jacketsAndBackpacks}</p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={s.searchArtistAlbum}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                variant={showFeatured ? "default" : "outline"}
                onClick={() => setShowFeatured(!showFeatured)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Featured ({featuredCount})
              </Button>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{s.newest}</SelectItem>
                  <SelectItem value="popular">{s.popular}</SelectItem>
                  <SelectItem value="price-asc">{s.priceLowHigh}</SelectItem>
                  <SelectItem value="price-desc">{s.priceHighLow}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-square" />
                  <CardContent className="pt-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800">
                      {product.primary_image ? (
                        <div className="p-6 h-full flex items-center justify-center relative">
                          <div className="relative w-3/4 h-3/4">
                            <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-black/20 dark:border-white/10">
                              <img
                                src={product.primary_image}
                                alt={generateButtonAltTag(product.artist || '', product.title, product.format || '4cm')}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-black/40 pointer-events-none" />
                              <div className="absolute top-0 left-1/4 right-1/4 h-2/5 bg-gradient-to-b from-white/70 to-transparent blur-md pointer-events-none" />
                            </div>
                            <div className="absolute inset-0 rounded-full shadow-[0_15px_50px_rgba(0,0,0,0.7),0_5px_15px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.3)]" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300 dark:border-gray-600">
                              <Pin className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          {product.format && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {product.format}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Pin className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      
                      {product.is_new && (
                        <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                          {s.newLabel}
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {product.stock_quantity <= product.low_stock_threshold && (
                        <Badge variant="destructive" className="absolute bottom-2 left-2">
                          {s.limitedStock}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="pt-4 space-y-2">
                      {product.artist && (
                        <p className="text-sm font-medium text-muted-foreground truncate">
                          {product.artist}
                        </p>
                      )}
                      <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-primary">
                          €{product.price.toFixed(2)}
                        </p>
                        {product.format && (
                          <Badge variant="outline" className="text-xs">
                            {product.format}
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button className="w-full gap-2" variant="outline">
                        <ShoppingCart className="h-4 w-4" />
                        {s.addToCart}
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Pin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">{s.noButtonsFound}</h3>
              <p className="text-muted-foreground">
                {s.tryOtherFilter}
              </p>
            </Card>
          )}

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {s.highQuality}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {s.highQualityDesc}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {s.uniqueDesigns}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {s.uniqueDesignsDesc}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {s.fastDelivery}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {s.fastDeliveryDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}