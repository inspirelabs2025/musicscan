import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Sparkles, TrendingUp, MessageSquare, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { AppStructuredData } from '@/components/SEO/StructuredData';
import { FeaturedProductsCarousel } from '@/components/shop/FeaturedProductsCarousel';
import { ShopByCategorySection } from '@/components/shop/ShopByCategorySection';
import { NewArrivalsSection } from '@/components/shop/NewArrivalsSection';
import { NewsSection } from '@/components/NewsSection';

const Home = () => {
  const { user } = useAuth();
  
  // Apply SEO for home page
  useSEO({
    title: "MuziekSchatten - Koop & Verkoop Vinyl en CD's Online",
    description: "Ontdek zeldzame vinyl, CD's en muziek merchandise. Dagelijks nieuws, community marketplace en AI-powered collectie tools voor muziekliefhebbers.",
    keywords: "vinyl kopen, cd kopen, tweedehands muziek, vinyl marktplaats, cd winkel, zeldzame platen",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background">
      {/* SEO Structured Data */}
      <AppStructuredData />
      
      {/* Hero Section - Shop First */}
      <section className="relative overflow-hidden bg-gradient-to-br from-vinyl-purple/20 via-primary/10 to-vinyl-gold/20 py-20 md:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ShoppingBag className="w-12 h-12 text-vinyl-purple animate-pulse" />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
                Ontdek Muziekschatten
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Je online specialist voor zeldzame vinyl, CD's en muziek collectibles
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/shop">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Browse Shop
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link to="/news">
                  📰 Dagelijks Nieuws
                </Link>
              </Button>
            </div>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>200+ items te koop</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>50+ actieve verkopers</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Nieuwe items vandaag: 8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-pulse">🎵</div>
          <div className="absolute top-40 right-20 text-5xl animate-pulse delay-500">💿</div>
          <div className="absolute bottom-40 left-20 text-6xl animate-pulse delay-1000">🎸</div>
          <div className="absolute bottom-20 right-10 text-5xl animate-pulse delay-700">🎧</div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-vinyl-gold" />
                Featured Items
              </h2>
              <p className="text-muted-foreground">Onze beste en nieuwste vondsten</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/shop">Bekijk Alles →</Link>
            </Button>
          </div>
          <FeaturedProductsCarousel />
        </div>
      </section>

      {/* Compact Daily Music News */}
      <section className="py-12 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">📰 Dagelijks Muzieknieuws</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/news">Meer nieuws →</Link>
            </Button>
          </div>
          <NewsSection compact={true} limit={3} />
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Vind precies wat je zoekt</p>
          </div>
          <ShopByCategorySection />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                ⭐ Nieuw Binnen
              </h2>
              <p className="text-muted-foreground">Vers toegevoegd aan onze collectie</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/shop">Bekijk Alles →</Link>
            </Button>
          </div>
          <NewArrivalsSection />
        </div>
      </section>

      {/* Community Marketplace Teaser */}
      <section className="py-16 bg-gradient-to-br from-vinyl-purple/10 to-vinyl-gold/10">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-vinyl-purple" />
                    <h2 className="text-3xl font-bold">Community Marketplace</h2>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Ontdek ook unieke items van verzamelaars in onze community. 
                    Directe deals met particuliere verkopers.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/marketplace">
                      <Users className="mr-2 h-5 w-5" />
                      Bekijk Community Items
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-vinyl-purple">500+</div>
                    <div className="text-sm text-muted-foreground">Community Items</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-vinyl-gold">50+</div>
                    <div className="text-sm text-muted-foreground">Actieve Shops</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">€15-500</div>
                    <div className="text-sm text-muted-foreground">Prijs Range</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-vinyl-purple">⭐</div>
                    <div className="text-sm text-muted-foreground">Verified Sellers</div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compact Tools & Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">🛠️ Tools & Features</h2>
            <p className="text-muted-foreground">Beheer je collectie met AI-powered tools</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Quick Price Check</h3>
                <p className="text-sm text-muted-foreground">
                  Check direct de waarde van je platen
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/quick-price-check">Probeer →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-vinyl-purple/10 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-vinyl-purple" />
                </div>
                <h3 className="font-bold">Scan je Collectie</h3>
                <p className="text-sm text-muted-foreground">
                  Upload foto's en catalogiseer automatisch
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={user ? "/scanner" : "/auth"}>Start Scan →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-vinyl-gold/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-vinyl-gold" />
                </div>
                <h3 className="font-bold">AI Analyse</h3>
                <p className="text-sm text-muted-foreground">
                  Ontdek patronen in je muziek DNA
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={user ? "/ai-analysis" : "/auth"}>Analyseer →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold">Collection Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Praat met je collectie via AI
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={user ? "/collection-chat" : "/auth"}>Chat →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
