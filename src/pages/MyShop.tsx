import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, Store, ExternalLink, Copy, AlertCircle, Package, Eye, Plus, ShoppingCart, ChevronDown } from "lucide-react";
import { useShopItems } from "@/hooks/useShopItems";
import { useUserShop } from "@/hooks/useUserShop";
import { useMyCollection } from "@/hooks/useMyCollection";
import { ShopItemCard } from "@/components/ShopItemCard";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { ShopSetupWizard } from "@/components/ShopSetupWizard";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { QuickScanOptions } from "@/components/QuickScanOptions";

export default function MyShop() {
  const { shopItems, isLoading: itemsLoading } = useShopItems();
  const { shop, isLoading: shopLoading, updateShop, isUpdating } = useUserShop();
  const { items: readyForShopItems, isLoading: readyItemsLoading, updateItem, isUpdating: isUpdatingItem } = useMyCollection("ready_for_shop");
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
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

  if (itemsLoading || shopLoading || readyItemsLoading) {
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

        {/* Shop Settings - Collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="mb-8">
          <CollapsibleTrigger asChild>
            <Card className="p-4 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50 cursor-pointer hover:bg-accent/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Winkelinstellingen</h2>
                    <p className="text-sm text-muted-foreground">
                      Beheer je winkelnaam, beschrijving en instellingen
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
              </div>
            </Card>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <Card className="p-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50 animate-accordion-down">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Shop Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{shopItems.length}</div>
            <div className="text-sm text-muted-foreground">Items te koop</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{readyForShopItems.length}</div>
            <div className="text-sm text-muted-foreground">Klaar voor winkel</div>
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

        {/* Quick Scan Options */}
        <QuickScanOptions context="shop" className="mb-8" />

        {/* Shop Tabs */}
        <Card className="p-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <Tabs defaultValue="in-shop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in-shop" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Items in winkel
                <Badge variant="secondary" className="ml-1">
                  {shopItems.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ready-for-shop" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Klaar voor winkel
                <Badge variant="secondary" className="ml-1">
                  {readyForShopItems.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="in-shop" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Items die momenteel te koop staan</h3>
                <Link to="/my-collection">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Items toevoegen
                  </Button>
                </Link>
              </div>

              {shopItems.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Geen items in winkel</h4>
                  <p className="text-muted-foreground mb-4">
                    Je hebt nog geen items te koop gezet. Kijk in de "Klaar voor winkel" tab of ga naar je collectie.
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
            </TabsContent>
            
            <TabsContent value="ready-for-shop" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Items klaar om toe te voegen aan winkel</h3>
                <p className="text-sm text-muted-foreground">
                  Deze items hebben prijsinformatie maar staan nog niet te koop
                </p>
              </div>

              {readyForShopItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Geen items klaar voor winkel</h4>
                  <p className="text-muted-foreground mb-4">
                    Scan meer items met prijsinformatie om ze hier te zien verschijnen.
                  </p>
                  <Link to="/scan">
                    <Button>
                      Items scannen
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {readyForShopItems.map((item) => (
                    <div key={item.id} className="relative">
                      <CollectionItemCard
                        item={item}
                        onUpdate={(updates) => {
                          updateItem({
                            id: item.id,
                            media_type: item.media_type,
                            updates
                          });
                          if (updates.is_for_sale) {
                            toast({
                              title: "Item toegevoegd aan winkel",
                              description: `${item.artist} - ${item.title} staat nu te koop.`,
                            });
                          }
                        }}
                        isUpdating={isUpdatingItem}
                        showControls={true}
                      />
                      {item.calculated_advice_price && (
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              updateItem({
                                id: item.id,
                                media_type: item.media_type,
                                updates: {
                                  is_for_sale: true,
                                  marketplace_price: item.calculated_advice_price
                                }
                              });
                              toast({
                                title: "Item toegevoegd aan winkel",
                                description: `${item.artist} - ${item.title} staat nu te koop voor €${item.calculated_advice_price}.`,
                              });
                            }}
                            disabled={isUpdatingItem}
                            className="text-xs"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Naar winkel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}