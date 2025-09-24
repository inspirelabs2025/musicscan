import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Store, ExternalLink, Copy, AlertCircle, Package, Eye, Plus } from "lucide-react";
import { useShopItems } from "@/hooks/useShopItems";
import { useUserShop } from "@/hooks/useUserShop";
import { ShopItemCard } from "@/components/ShopItemCard";
import { ShopSetupWizard } from "@/components/ShopSetupWizard";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function MyShop() {
  const { shopItems, isLoading: itemsLoading } = useShopItems();
  const { shop, isLoading: shopLoading, updateShop, isUpdating } = useUserShop();
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  
  const [shopSettings, setShopSettings] = useState({
    shop_name: shop?.shop_name || "",
    shop_description: shop?.shop_description || "",
    contact_info: shop?.contact_info || "",
    shop_url_slug: shop?.shop_url_slug || "",
    is_public: shop?.is_public || false,
  });

  // Update local state when shop data changes
  useEffect(() => {
    if (shop) {
      setShopSettings({
        shop_name: shop.shop_name || "",
        shop_description: shop.shop_description || "",
        contact_info: shop.contact_info || "",
        shop_url_slug: shop.shop_url_slug || "",
        is_public: shop.is_public || false,
      });
    }
  }, [shop]);

  // Check if shop needs setup
  const needsSetup = !shop?.shop_name || !shop?.shop_description || !shop?.contact_info;

  // Show wizard automatically if shop needs setup
  useEffect(() => {
    if (needsSetup && !shopLoading) {
      setShowWizard(true);
    }
  }, [needsSetup, shopLoading]);

  const handleShopUpdate = () => {
    updateShop(shopSettings, {
      onSuccess: () => {
        toast({
          title: "Winkel bijgewerkt",
          description: "Je winkelinstellingen zijn opgeslagen.",
        });
      },
      onError: (error) => {
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het opslaan.",
          variant: "destructive",
        });
      },
    });
  };

  const copyShopUrl = () => {
    if (shop?.shop_url_slug) {
      const url = `${window.location.origin}/shop/${shop.shop_url_slug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "URL gekopieerd",
        description: "De winkel URL is naar je klembord gekopieerd.",
      });
    }
  };

  if (itemsLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            Mijn Winkel
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Beheer je persoonlijke muziekwinkel en de items die je te koop aanbiedt.
          </p>
        </div>

        {/* Shop Settings */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Winkelinstellingen</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="shop_name">Winkelnaam</Label>
              <Input
                id="shop_name"
                value={shopSettings.shop_name}
                onChange={(e) => setShopSettings(prev => ({
                  ...prev,
                  shop_name: e.target.value
                }))}
                placeholder="Mijn Muziekwinkel"
              />
            </div>
            
            <div>
              <Label htmlFor="shop_url_slug">Winkel URL</Label>
              <div className="flex gap-2">
                <Input
                  id="shop_url_slug"
                  value={shopSettings.shop_url_slug}
                  onChange={(e) => setShopSettings(prev => ({
                    ...prev,
                    shop_url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  }))}
                  placeholder="mijn-winkel"
                />
                {shop?.shop_url_slug && (
                  <Button
                    variant="outline"
                    onClick={copyShopUrl}
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Je winkel wordt beschikbaar op: /shop/{shopSettings.shop_url_slug}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="shop_description">Winkelbeschrijving</Label>
            <Textarea
              id="shop_description"
              value={shopSettings.shop_description}
              onChange={(e) => setShopSettings(prev => ({
                ...prev,
                shop_description: e.target.value
              }))}
              placeholder="Vertel bezoekers over je winkel..."
              className="min-h-[80px]"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="contact_info">Contactinformatie</Label>
            <Textarea
              id="contact_info"
              value={shopSettings.contact_info}
              onChange={(e) => setShopSettings(prev => ({
                ...prev,
                contact_info: e.target.value
              }))}
              placeholder="Email, telefoon, of andere contactgegevens..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <Label htmlFor="is_public">Winkel publiek maken</Label>
              <p className="text-sm text-muted-foreground">
                Maak je winkel zichtbaar voor anderen
              </p>
            </div>
            <Switch
              id="is_public"
              checked={shopSettings.is_public}
              onCheckedChange={(checked) => setShopSettings(prev => ({
                ...prev,
                is_public: checked
              }))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleShopUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Opslaan..." : "Instellingen opslaan"}
            </Button>
            
            {shop?.shop_url_slug && shop?.is_public && (
              <Button
                variant="outline"
                onClick={() => window.open(`/shop/${shop.shop_url_slug}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Bekijk winkel
              </Button>
            )}
          </div>
        </Card>

        {/* Shop Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{shopItems.length}</div>
            <div className="text-sm text-muted-foreground">Items te koop</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="text-2xl font-bold">{shop?.view_count || 0}</div>
            <div className="text-sm text-muted-foreground">Winkel bezoekers</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="text-2xl font-bold">
              {shopItems.filter(item => item.is_public).length}
            </div>
            <div className="text-sm text-muted-foreground">Publiek zichtbaar</div>
          </Card>
        </div>

        {/* Shop Items */}
        <Card className="p-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Items in winkel</h2>
            <Link to="/my-collection">
              <Button variant="outline">
                Items toevoegen
              </Button>
            </Link>
          </div>

          {shopItems.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geen items in winkel</h3>
              <p className="text-muted-foreground mb-4">
                Je hebt nog geen items te koop gezet. Ga naar je collectie om items toe te voegen.
              </p>
              <Link to="/my-collection">
                <Button>
                  Ga naar collectie
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {shopItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  shopContactInfo={shop?.contact_info}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}