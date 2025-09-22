import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { CartItem } from "@/hooks/useShoppingCart";

interface GuestCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onSuccess: () => void;
}

export const GuestCheckoutModal = ({ open, onOpenChange, items, onSuccess }: GuestCheckoutModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Nederland"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const shippingAddress = {
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country
      };

      const { data, error } = await supabase.functions.invoke('create-guest-shop-payment', {
        body: {
          items: items.map(item => ({
            id: item.id,
            media_type: item.media_type
          })),
          shippingAddress,
          buyerName: formData.name,
          buyerEmail: formData.email
        }
      });

      if (error) throw error;

      // Open Stripe checkout in new window
      window.open(data.url, '_blank');
      
      onSuccess();
      onOpenChange(false);
      
      toast({
        title: "Betalingslink geopend",
        description: "Voltooi je betaling in het nieuwe venster.",
      });
    } catch (error) {
      console.error('Guest checkout error:', error);
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van de bestelling.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gast Bestelling</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Volledige naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Straat en huisnummer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Plaats *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Totaal:</span>
              <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Doorgaan naar betaling
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};