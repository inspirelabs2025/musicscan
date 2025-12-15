import { Link } from 'react-router-dom';
import { Sparkles, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlatformProducts } from '@/hooks/usePlatformProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export const MetalPrintSpotlight = () => {
  const isMobile = useIsMobile();
  const { data: allArtProducts, isLoading } = usePlatformProducts({ 
    mediaType: 'art',
    limit: 6 
  });

  // Filter: only show metal prints (exclude posters, canvas, and t-shirts)
  const artProducts = allArtProducts?.filter(product => 
    !product.tags?.includes('poster') && 
    !product.tags?.includes('canvas') &&
    !product.tags?.includes('tshirts') &&
    !product.categories?.includes('POSTER') &&
    !product.categories?.includes('CANVAS')
  );

  const displayProduct = artProducts?.[0];
  const displayImage = displayProduct?.primary_image;

  return (
    <section className={isMobile ? "py-8 bg-gradient-to-br from-background via-vinyl-gold/5 to-background relative overflow-hidden" : "py-16 bg-gradient-to-br from-background via-vinyl-gold/5 to-background relative overflow-hidden"}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className={isMobile ? "text-center mb-4" : "text-center mb-12"}>
            <h2 className={isMobile ? "text-xl font-bold mb-2" : "text-4xl md:text-5xl font-bold mb-4"}>
              🎨 Album Cover op Metaal
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Transformeer iconische album artwork in prachtige metalen wanddecoratie
              </p>
            )}
          </div>

          {isMobile ? (
            /* Mobile: Compact layout */
            <div className="space-y-4">
              {/* Before/After side by side - compact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Card className="p-1 bg-card border">
                    <div className="aspect-square rounded overflow-hidden bg-muted flex items-center justify-center">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : displayImage ? (
                        <img src={displayImage} alt="Album" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-3xl">🎨</div>
                      )}
                    </div>
                  </Card>
                  <span className="absolute top-2 left-2 bg-background/90 px-2 py-0.5 rounded-full text-[10px] font-medium">
                    Origineel
                  </span>
                </div>
                <div className="relative">
                  <Card className="p-1 bg-gradient-to-br from-red-100/30 to-green-100/30 dark:from-red-950/20 dark:to-green-950/20 border border-red-300/50">
                    <div className="aspect-square rounded overflow-hidden relative bg-muted flex items-center justify-center">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : displayImage ? (
                        <>
                          <img src={displayImage} alt="Metal print" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div className="text-3xl">🎨</div>
                      )}
                    </div>
                  </Card>
                  <span className="absolute top-2 right-2 bg-vinyl-gold/90 px-2 py-0.5 rounded-full text-[10px] font-medium text-white">
                    Op Metaal
                  </span>
                </div>
              </div>

              {/* Price + CTA compact */}
              <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">Vanaf</p>
                  <p className="text-xl font-bold text-vinyl-gold">€49,95</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-to-r from-vinyl-gold to-amber-500">
                  <Link to="/art-shop">Bekijk Collectie</Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Desktop: Full layout */
            <>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Left: Before/After Comparison */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <Card className="p-2 bg-card border-2 border-border hover:border-primary/50 transition-all">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {isLoading ? (
                            <Skeleton className="w-full h-full" />
                          ) : displayImage ? (
                            <img src={displayImage} alt={displayProduct?.title || "Album artwork"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-6xl">🎨</div>
                          )}
                        </div>
                      </Card>
                      <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold border border-border">
                        📀 Origineel
                      </span>
                    </div>
                    <div className="relative group">
                      <Card className="p-2 bg-gradient-to-br from-red-100/30 to-green-100/30 dark:from-red-950/20 dark:to-green-950/20 border-2 border-red-400/50 hover:border-red-500 transition-all">
                        <div className="aspect-square rounded-lg overflow-hidden relative metal-print-effect bg-muted flex items-center justify-center">
                          {isLoading ? (
                            <Skeleton className="w-full h-full" />
                          ) : displayImage ? (
                            <>
                              <img src={displayImage} alt={`${displayProduct?.title || "Album"} metal print`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-white/30 to-transparent blur-xl pointer-events-none" />
                            </>
                          ) : (
                            <div className="text-6xl">🎨</div>
                          )}
                        </div>
                      </Card>
                      <span className="absolute top-4 right-4 bg-vinyl-gold/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white border border-vinyl-gold">
                        ✨ Op Metaal
                      </span>
                      <div className="absolute -inset-2 bg-gradient-to-br from-red-500/30 to-green-500/30 blur-xl -z-10 group-hover:blur-2xl transition-all" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Zie het verschil: van album artwork naar luxe metalen wanddecoratie
                  </p>
                </div>

                {/* Right: Features & CTA */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                    {[
                      { icon: Sparkles, text: 'Hoogwaardige Metalen Prints' },
                      { icon: Check, text: 'Premium Afwerking' },
                      { icon: Check, text: 'Direct aan de Muur' }
                    ].map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vinyl-gold to-amber-500 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg font-semibold">{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-card p-6 rounded-lg border-2 border-vinyl-gold/30">
                    <p className="text-sm text-muted-foreground mb-2">Vanaf</p>
                    <p className="text-4xl font-bold text-vinyl-gold mb-4">€49,95</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>✓ Gratis Verzending</span>
                      <span>✓ 30 Dagen Retour</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="text-lg bg-gradient-to-r from-vinyl-gold to-amber-500 hover:shadow-lg hover:scale-105 transition-all">
                      <Link to="/art-shop">Bekijk Collectie</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-lg border-2 border-vinyl-gold text-vinyl-gold hover:bg-vinyl-gold/10">
                      <Link to="/scanner">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload je Album
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Popular prints showcase - desktop only */}
              {artProducts && artProducts.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-6 text-center">Populaire Prints</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {artProducts.map((product) => (
                      <Link key={product.id} to={`/product/${product.slug}`}>
                        <Card className="aspect-square overflow-hidden hover:shadow-xl hover:scale-105 transition-all cursor-pointer group border-2 hover:border-red-500">
                          <img src={product.primary_image || ''} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
