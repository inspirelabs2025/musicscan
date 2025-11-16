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

export default function ButtonsShop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "popular">("newest");
  const [showFeatured, setShowFeatured] = useState(false);

  const { data: allProducts, isLoading } = usePlatformProducts({ 
    mediaType: 'merchandise',
    featured: showFeatured || undefined,
  });

  // Filter only BUTTON products
  const buttonProducts = allProducts?.filter(product => 
    product.categories?.includes('buttons') || product.categories?.includes('badges')
  );

  // Filter and sort products
  const filteredProducts = buttonProducts
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
        <link rel="canonical" href="https://musicscan.app/buttons" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Artist Buttons Collectie",
            "description": "Buttons en badges met iconische muziekartisten",
            "url": "https://musicscan.app/buttons",
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
        <div className="container py-8 space-y-8">
          <BreadcrumbNavigation items={[
            { name: "Home", url: "/" },
            { name: "Buttons Shop", url: "/buttons" }
          ]} />

          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Pin className="h-12 w-12" />
                <h1 className="text-5xl font-bold">Artist Buttons</h1>
              </div>
              <p className="text-xl mb-6 text-blue-50">
                Speld je favoriete artiesten! Unieke buttons en badges met iconische muzikanten.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Badge variant="secondary" className="text-base py-2 px-4">
                  📌 {buttonProducts?.length || 0} Buttons
                </Badge>
                <Badge variant="secondary" className="text-base py-2 px-4">
                  💰 Vanaf €4,50
                </Badge>
                <Badge variant="secondary" className="text-base py-2 px-4">
                  📏 3.5cm - 4cm
                </Badge>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* Size Info Banner */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    3.5
                  </div>
                  <div>
                    <p className="font-semibold">3.5cm - Compact</p>
                    <p className="text-sm text-muted-foreground">Perfect voor caps & tassen</p>
                  </div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold">4cm - Standaard</p>
                    <p className="text-sm text-muted-foreground">Beste zichtbaarheid op jackets</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op artiest, album, genre..."
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
                  <SelectItem value="newest">Nieuwste</SelectItem>
                  <SelectItem value="popular">Populair</SelectItem>
                  <SelectItem value="price-asc">Prijs: Laag - Hoog</SelectItem>
                  <SelectItem value="price-desc">Prijs: Hoog - Laag</SelectItem>
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
                        <div className="p-8 h-full flex items-center justify-center">
                          <img
                            src={product.primary_image}
                            alt={generateButtonAltTag(
                              product.artist || '',
                              product.title,
                              product.format || '4cm'
                            )}
                            className="w-full h-full object-contain rounded-full shadow-xl group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Pin className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      
                      {product.is_new && (
                        <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                          Nieuw
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
                          Beperkte voorraad
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
                        In Winkelwagen
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Pin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Geen buttons gevonden</h3>
              <p className="text-muted-foreground">
                Probeer een andere zoekopdracht of filter.
              </p>
            </Card>
          )}

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📌 Hoogwaardige Kwaliteit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Duurzaam materiaal met scherpe prints. Veiligheidsspeld of vlindersluiting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 Unieke Designs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exclusieve artist buttons die je nergens anders vindt. Limited editions beschikbaar.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚀 Snelle Levering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gratis verzending bij 5+ buttons. Thuisbezorgd binnen 2-4 werkdagen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
