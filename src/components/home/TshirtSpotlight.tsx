import { Link } from 'react-router-dom';
import { Sparkles, Wand2, Check, Shirt, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlatformProducts } from '@/hooks/usePlatformProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export const TshirtSpotlight = () => {
  const isMobile = useIsMobile();
  const { data: tshirtProducts, isLoading } = usePlatformProducts({ 
    category: 'tshirts',
    limit: 6 
  });

  const features = [
    { icon: Sparkles, text: '7 Unieke Designs per Album' },
    { icon: Wand2, text: 'AI-Gegenereerd Artwork' },
    { icon: Check, text: 'Premium Kwaliteit Stof' },
    { icon: Shirt, text: 'Alle Maten Beschikbaar' }
  ];

  // Mobile compact view
  if (isMobile) {
    return (
      <section className="py-8 bg-gradient-to-br from-background via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">👕 Draag je Favoriete Album</h2>
            <Link to="/tshirts">
              <Button variant="ghost" size="sm" className="text-primary">
                Meer <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {isLoading ? (
              Array(2).fill(0).map((_, i) => (
                <Card key={i} className="aspect-[3/4] p-2">
                  <Skeleton className="w-full h-full rounded-lg" />
                </Card>
              ))
            ) : tshirtProducts && tshirtProducts.length > 0 ? (
              tshirtProducts.slice(0, 2).map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`}>
                  <Card className="aspect-[3/4] p-2 hover:shadow-lg transition-all cursor-pointer group border hover:border-primary relative overflow-hidden">
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {product.primary_image ? (
                        <img 
                          src={product.primary_image} 
                          alt={product.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-3xl">👕</div>
                      )}
                    </div>
                    <span className="absolute bottom-2 left-2 bg-vinyl-gold/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold text-white">
                      €{product.price}
                    </span>
                  </Card>
                </Link>
              ))
            ) : (
              Array(2).fill(0).map((_, i) => (
                <Card key={i} className="aspect-[3/4] p-2 border-dashed">
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <div className="text-3xl opacity-50">👕</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background via-accent/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              👕 Draag je Favoriete Album
            </h2>
            <p className="text-xl text-muted-foreground">
              Premium T-shirts met iconische album artwork
            </p>
          </div>

          {/* Main showcase with split layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left: T-shirt Designs Showcase - 2x2 Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="aspect-[3/4] p-4">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </Card>
                  ))
                ) : tshirtProducts && tshirtProducts.length > 0 ? (
                  tshirtProducts.slice(0, 4).map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="aspect-[3/4] p-3 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-primary relative overflow-hidden">
                        <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          {product.primary_image ? (
                            <img 
                              src={product.primary_image} 
                              alt={product.title}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-4xl">👕</div>
                          )}
                        </div>
                        {/* Price badge */}
                        <span className="absolute bottom-3 left-3 bg-vinyl-gold/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white">
                          €{product.price}
                        </span>
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 blur-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Card>
                    </Link>
                  ))
                ) : (
                  // Placeholder t-shirts
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="aspect-[3/4] p-3 border-2 border-dashed border-border">
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <div className="text-4xl opacity-50">👕</div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              
              {/* Showcase description */}
              <p className="text-sm text-muted-foreground text-center">
                Elk album krijgt 7 unieke AI-gegenereerde T-shirt designs
              </p>
            </div>

            {/* Right: Features & CTA */}
            <div className="flex flex-col justify-center space-y-6">
              {/* Features list */}
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-semibold">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Pricing Card */}
              <div className="bg-card p-6 rounded-lg border-2 border-vinyl-gold/50 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Premium Katoen T-shirt</p>
                  <p className="text-5xl font-bold text-vinyl-gold">€24,95</p>
                  <p className="text-xs text-muted-foreground mt-2">Per T-shirt</p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3 border-t">
                  <span>✓ Gratis Verzending</span>
                  <span>✓ Maten S t/m XXL</span>
                  <span>✓ 7 Unieke Designs</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Link to="/tshirts">
                    👕 Browse T-shirts Shop
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="text-lg border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Link to="/admin/tshirt-generator">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Genereer je Eigen
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Recent T-shirts Grid */}
          {tshirtProducts && tshirtProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center">Nieuwste items</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {tshirtProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`}>
                    <Card className="aspect-[3/4] overflow-hidden hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-primary">
                      {product.primary_image ? (
                        <img 
                          src={product.primary_image} 
                          alt={product.title}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <span className="text-4xl">👕</span>
                        </div>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
