import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, CreditCard } from "lucide-react";
import { useGuestOrderTracking } from "@/hooks/useGuestOrderTracking";

export const GuestOrderTracking = () => {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const { loading, order, error, trackOrder } = useGuestOrderTracking();

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId && email) {
      await trackOrder(orderId, email);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gast Bestelling Volgen
          </CardTitle>
          <CardDescription>
            Voer je bestelnummer en e-mailadres in om je gastbestelling te volgen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Bestelnummer *</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Bijv: 123e4567-e89b-12d3-a456-426614174000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.com"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Bestelling Zoeken
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {order && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-4">Bestelling Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Betaalstatus</p>
                    <Badge variant={getPaymentStatusColor(order.payment_status)}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Besteldatum</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totaal</p>
                    <p className="font-semibold text-lg">
                      {order.currency === 'EUR' ? '€' : order.currency}{order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {order.shipping_address && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Verzendadres</p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <p className="font-medium">{order.buyer_name}</p>
                      <p>{order.shipping_address.address}</p>
                      <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                      <p>{order.shipping_address.country}</p>
                    </div>
                  </div>
                )}

                {order.order_items && order.order_items.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bestelde items</p>
                    <div className="space-y-2">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.item_data?.artist} - {item.item_data?.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.item_type?.toUpperCase()}
                                </Badge>
                                {item.item_data?.condition_grade && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.item_data.condition_grade}
                                  </Badge>
                                )}
                              </div>
                              {item.item_data?.catalog_number && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Cat. nr: {item.item_data.catalog_number}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">€{item.price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                Aantal: {item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};