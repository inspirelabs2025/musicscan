import { TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { useTimeMachineProducts } from '@/hooks/useTimeMachineProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Sparkles, Package, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TimeMachineProductCTAProps {
  event: TimeMachineEvent;
}

export function TimeMachineProductCTA({ event }: TimeMachineProductCTAProps) {
  const navigate = useNavigate();
  const { data: products, isLoading } = useTimeMachineProducts(event.id);

  const fineArtProduct = products?.find(p => p.metadata?.product_type === 'fine_art_print');
  const metalProduct = products?.find(p => p.metadata?.product_type === 'metal_print_deluxe');

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-16 mb-8"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Limited Edition
            </Badge>
            <h2 className="text-3xl font-bold mb-2">Own This Memory</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Breng de magie van {event.artist_name} naar je muur. 
              Elke poster bevat een unieke QR-code die teruglinkt naar deze verhalen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Fine Art Print */}
            <Card className="overflow-hidden hover:border-primary transition-colors">
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                {event.poster_image_url ? (
                  <img
                    src={event.poster_image_url}
                    alt="Fine Art Print"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Fine Art Print</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hahnemühle papier, 50×70 cm<br/>
                  Inclusief QR-code + hologram label
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">€{event.price_poster?.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    {event.edition_size ? `${event.edition_size} exemplaren` : 'Limited'}
                  </span>
                </div>
                {isLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laden...
                  </Button>
                ) : fineArtProduct ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/product/${fineArtProduct.slug}`)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Bestel Fine Art Print
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Binnenkort Beschikbaar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Metal Print */}
            <Card className="overflow-hidden hover:border-primary transition-colors relative">
              <Badge className="absolute top-4 right-4 z-10 bg-primary">
                Premium
              </Badge>
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                {event.metal_print_image_url ? (
                  <img
                    src={event.metal_print_image_url}
                    alt="Metal Print"
                    className="w-full h-full object-cover"
                  />
                ) : event.poster_image_url ? (
                  <img
                    src={event.poster_image_url}
                    alt="Metal Print"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Metal Print Deluxe</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aluminium geborsteld, 40×60 cm<br/>
                  Met subtiele paars reflectie-effect
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">€{event.price_metal?.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">
                    100 exemplaren
                  </span>
                </div>
                {isLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laden...
                  </Button>
                ) : metalProduct ? (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="default"
                    onClick={() => navigate(`/product/${metalProduct.slug}`)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Bestel Metal Print
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Binnenkort Beschikbaar
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              ✨ Elke poster wordt genummerd en bevat een unieke QR-code<br/>
              🚚 Gratis verzending binnen Nederland
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
