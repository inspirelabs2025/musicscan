import React, { useState } from 'react';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { GuestCheckoutModal } from './GuestCheckoutModal';

export const ShoppingCartWidget = () => {
  const { items, removeFromCart, getTotalPrice, getItemCount, checkout, isLoading, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [guestCheckoutOpen, setGuestCheckoutOpen] = useState(false);

  const handleCheckout = async () => {
    console.log('[ShoppingCartWidget] Checkout button clicked, user:', user ? 'logged in' : 'guest');
    
    if (user) {
      // Authenticated user checkout
      try {
        console.log('[ShoppingCartWidget] Starting authenticated checkout');
        const result = await checkout();
        console.log('[ShoppingCartWidget] Checkout result:', result);
        
        if (result?.url) {
          console.log('[ShoppingCartWidget] Opening Stripe checkout:', result.url);
          window.open(result.url, '_blank');
          
          toast({
            title: "Betalingslink geopend",
            description: "Voltooi je betaling in het nieuwe venster.",
          });
        } else {
          console.error('[ShoppingCartWidget] No URL in result:', result);
          throw new Error('Geen checkout URL ontvangen');
        }
      } catch (error) {
        console.error('[ShoppingCartWidget] Checkout error:', error);
        toast({
          title: "Afrekenen mislukt",
          description: error instanceof Error ? error.message : "Er is iets misgegaan",
          variant: "destructive",
        });
      }
    } else {
      // Guest checkout
      console.log('[ShoppingCartWidget] Opening guest checkout modal');
      setGuestCheckoutOpen(true);
    }
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="w-4 h-4" />
          {getItemCount() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {getItemCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Winkelwagen ({getItemCount()} items)</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Je winkelwagen is leeg</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={`${item.artist} - ${item.title}`}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.artist}</h4>
                        <p className="text-sm text-muted-foreground truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {item.media_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.condition_grade}
                          </Badge>
                          {item.selected_style && (
                            <Badge variant="default" className="text-xs bg-primary">
                              {item.selected_style}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold mt-1">{formatPrice(item.price)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Totaal:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                
                <Button 
                  onClick={handleCheckout} 
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Bezig met afrekenen..." : user ? "Afrekenen" : "Afrekenen als gast"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Je wordt doorgestuurd naar een veilige Stripe checkout pagina
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
      
      <GuestCheckoutModal
        open={guestCheckoutOpen}
        onOpenChange={setGuestCheckoutOpen}
        items={items}
        onSuccess={() => {
          clearCart();
          toast({
            title: "Bestelling aangemaakt",
            description: "Check je e-mail voor de bestelnummer om je bestelling te volgen.",
          });
        }}
      />
    </Sheet>
  );
};