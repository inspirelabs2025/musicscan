import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AdminShopOrder, useUpdateOrderStatus } from "@/hooks/useAdminShopOrders";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Copy, Mail, User, Package, Euro, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetailDialogProps {
  order: AdminShopOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const { toast } = useToast();
  const updateOrderStatus = useUpdateOrderStatus();
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>("");

  if (!order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast({
      title: "Gekopieerd",
      description: "Order ID gekopieerd naar klembord",
    });
  };

  const handleStatusUpdate = () => {
    if (newStatus || newPaymentStatus) {
      updateOrderStatus.mutate({
        orderId: order.id,
        status: newStatus || undefined,
        paymentStatus: newPaymentStatus || undefined,
      });
      setNewStatus("");
      setNewPaymentStatus("");
    }
  };

  const shippingAddress = order.shipping_address || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <div>
              <div>Order Details</div>
              <div className="text-sm text-muted-foreground font-normal font-mono">
                {order.id.substring(0, 8)}...
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Order Informatie
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Order ID</div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs">{order.id}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopyOrderId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Aangemaakt</div>
                <div className="text-sm mt-1">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: nl })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge className="mt-1">{order.status}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Betaling Status</div>
                <Badge className="mt-1">{order.payment_status}</Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Update Status</div>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies nieuwe status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Update Betaling</div>
                <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies betaling status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={!newStatus && !newPaymentStatus}
              className="mt-3"
            >
              Status Bijwerken
            </Button>
          </Card>

          {/* Buyer Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Koper Informatie
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={order.buyer?.avatar_url} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{order.buyer_name}</div>
                <div className="text-sm text-muted-foreground">{order.buyer_email}</div>
              </div>
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <a href={`mailto:${order.buyer_email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </a>
              </Button>
            </div>

            {Object.keys(shippingAddress).length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Verzendadres
                  </div>
                  <div className="text-sm space-y-1">
                    {shippingAddress.street && <div>{shippingAddress.street}</div>}
                    {shippingAddress.city && (
                      <div>
                        {shippingAddress.postal_code} {shippingAddress.city}
                      </div>
                    )}
                    {shippingAddress.country && <div>{shippingAddress.country}</div>}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Order Items */}
          {order.shop_order_items && order.shop_order_items.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.shop_order_items.map((item: any) => {
                  const itemData = item.item_data || {};
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline">{item.item_type}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {itemData.artist} - {itemData.title}
                        </div>
                        {itemData.condition && (
                          <div className="text-xs text-muted-foreground">
                            Conditie: {itemData.condition}
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        {item.quantity}x €{item.price.toFixed(2)}
                      </div>
                      <div className="font-semibold">
                        €{(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Financieel Overzicht
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal</span>
                <span>€{(order.total_amount - order.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verzendkosten</span>
                <span>€{order.shipping_cost.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Totaal</span>
                <span>€{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Valuta: {order.currency}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
