import { Link } from 'react-router-dom';
import { Sparkles, Wand2, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlatformProducts } from '@/hooks/usePlatformProducts';
import { Skeleton } from '@/components/ui/skeleton';

export const SocksSpotlight = () => {
  const { data: sockProducts, isLoading } = usePlatformProducts({ 
    category: 'socks',
    limit: 6 
  });

  const features = [
    { icon: Sparkles, text: '7 Unieke Designs per Album' },
    { icon: Wand2, text: 'AI-Gegenereerd Artwork' },
    { icon: Check, text: 'Premium Materials' },
    { icon: Package, text: 'Luxe Geschenkdoos' }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-background via-vinyl-purple/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              🧦 Jouw Favoriete Album aan je Voeten
            </h2>
            <p className="text-xl text-muted-foreground">
              Transformeer iconische album artwork in wearable art
            </p>
          </div>

          {/* Main showcase with split layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left: Sock Designs Showcase - 2x2 Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="aspect-square p-4">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </Card>
                  ))
                ) : sockProducts && sockProducts.length > 0 ? (
                  sockProducts.slice(0, 4).map((product, index) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="aspect-square p-3 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-vinyl-purple relative overflow-hidden">
                        <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-vinyl-purple/10 to-accent/10 flex items-center justify-center">
                          {product.primary_image ? (
                            <img 
                              src={product.primary_image} 
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-4xl">🧦</div>
                          )}
                        </div>
                        {/* Price badge */}
                        <span className="absolute bottom-3 left-3 bg-vinyl-gold/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white">
                          €{product.price}
                        </span>
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-vinyl-purple/30 to-accent/30 blur-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Card>
                    </Link>
                  ))
                ) : (
                  // Placeholder socks
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="aspect-square p-3 border-2 border-dashed border-border">
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-vinyl-purple/10 to-accent/10 flex items-center justify-center">
                        <div className="text-4xl opacity-50">🧦</div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              
              {/* Showcase description */}
              <p className="text-sm text-muted-foreground text-center">
                Elk album krijgt 7 unieke AI-gegenereerde sock designs
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-semibold">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Pricing Card */}
              <div className="bg-card p-6 rounded-lg border-2 border-vinyl-purple/30 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Standard Cotton</p>
                  <p className="text-3xl font-bold text-vinyl-purple">€14,95</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Premium Merino</p>
                  <p className="text-3xl font-bold text-vinyl-gold">€24,95</p>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <span>✓ Gratis Verzending</span>
                  <span>✓ One Size (EU 38-46)</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-lg bg-gradient-to-r from-vinyl-purple to-accent hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Link to="/socks">
                    🧦 Browse Socks Shop
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="text-lg border-2 border-vinyl-purple text-vinyl-purple hover:bg-vinyl-purple/10"
                >
                  <Link to="/admin/sock-generator">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Genereer je Eigen
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Recent Socks Grid */}
          {sockProducts && sockProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center">Recent Gegenereerd</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {sockProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`}>
                    <Card className="aspect-square overflow-hidden hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-vinyl-purple">
                      {product.primary_image ? (
                        <img 
                          src={product.primary_image} 
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vinyl-purple/10 to-accent/10">
                          <span className="text-4xl">🧦</span>
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
