import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Home, ShoppingBag } from "lucide-react";
import { useShopOrder } from "@/hooks/useShopOrders";
import { useGuestOrderTracking } from "@/hooks/useGuestOrderTracking";
import { useAuth } from "@/contexts/AuthContext";
import { trackPurchase } from "@/utils/googleAnalytics";

export const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const { user } = useAuth();
  
  // Use authenticated hook if user is logged in, otherwise use guest tracking
  const { data: authOrder, isLoading: authLoading } = useShopOrder(orderId || '');
  const { order: guestOrder, loading: guestLoading, trackOrder } = useGuestOrderTracking();
  
  const [guestEmail, setGuestEmail] = useState<string | null>(null);

  useEffect(() => {
    // For guest orders, try to get email from session storage or URL
    if (!user && orderId) {
      const storedEmail = sessionStorage.getItem('guest-checkout-email');
      if (storedEmail) {
        setGuestEmail(storedEmail);
        trackOrder(orderId, storedEmail);
        // Clear the email from session storage
        sessionStorage.removeItem('guest-checkout-email');
      }
    }
  }, [orderId, user, trackOrder]);

  const order = user ? authOrder : guestOrder;
  const loading = user ? authLoading : guestLoading;
  
  // Track purchase conversion when order data is available
  useEffect(() => {
    if (order && orderId) {
      trackPurchase(
        orderId,
        order.order_items || [],
        order.total_amount,
        order.shipping_cost || 0
      );
    }
  }, [order, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {user ? "Bestelling Geplaatst!" : "Gastbestelling Geplaatst!"}
            </CardTitle>
            <CardDescription>
              {user 
                ? "Je bestelling is succesvol geplaatst en wordt verwerkt."
                : "Je gastbestelling is succesvol geplaatst. Check je e-mail voor bevestiging."
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {orderId && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Bestelnummer</p>
                <p className="font-mono text-lg font-semibold">{orderId}</p>
                {!user && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Bewaar dit nummer om je bestelling te kunnen volgen
                  </p>
                )}
              </div>
            )}

            {order && (
              <div className="text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Totaal:</span>
                  <span className="font-semibold text-lg">
                    €{order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-left bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Wat gebeurt er nu?</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Je ontvangt een bevestigingsmail</li>
                  <li>• De verkoper wordt op de hoogte gebracht</li>
                  {user ? (
                    <li>• Je kunt de bestelling volgen in je dashboard</li>
                  ) : (
                    <li>• Je kunt je bestelling volgen met het bestelnummer en je e-mail</li>
                  )}
                  <li>• De verkoper neemt contact met je op voor verzending</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                {user ? (
                  <Button asChild className="w-full">
                    <Link to="/dashboard">
                      <Package className="w-4 h-4 mr-2" />
                      Ga naar Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/track-order">
                      <Package className="w-4 h-4 mr-2" />
                      Bestelling Volgen
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/shops">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Verder Winkelen
                  </Link>
                </Button>

                <Button variant="ghost" asChild className="w-full">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Terug naar Home
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};