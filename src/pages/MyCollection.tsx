import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Music, Package, Store, Eye, EyeOff, ShoppingCart, Sparkles, Download, ExternalLink, Globe, Users, AlertTriangle } from "lucide-react";
import { useMyCollection } from "@/hooks/useMyCollection";
import { useUserShop } from "@/hooks/useUserShop";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function MyCollection() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "public" | "for_sale" | "private">("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  
  const { items, isLoading, updateItem, isUpdating, bulkUpdate, isBulkUpdating } = useMyCollection(filter);
  const { shop } = useUserShop();
  const { toast } = useToast();

  const handleItemUpdate = (itemId: string, mediaType: "cd" | "vinyl", updates: any) => {
    updateItem({ id: itemId, media_type: mediaType, updates }, {
      onSuccess: () => {
        toast({
          title: "Item bijgewerkt",
          description: "De wijzigingen zijn opgeslagen.",
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

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.size === 0) return;

    if (bulkAction === "fetch_artwork") {
      await batchFetchArtworkForSelected();
      return;
    }

    const selectedItemsData = Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return { id: itemId, media_type: item!.media_type };
    });

    let updates: any = {};
    switch (bulkAction) {
      case "make_public":
        updates = { is_public: true };
        break;
      case "make_private":
        updates = { is_public: false };
        break;
      case "add_to_shop":
        updates = { is_for_sale: true };
        break;
      case "remove_from_shop":
        updates = { is_for_sale: false };
        break;
    }

    bulkUpdate({ items: selectedItemsData, updates }, {
      onSuccess: () => {
        toast({
          title: "Bulk actie voltooid",
          description: `${selectedItems.size} items zijn bijgewerkt.`,
        });
        setSelectedItems(new Set());
        setBulkAction("");
      },
      onError: (error) => {
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij de bulk actie.",
          variant: "destructive",
        });
      },
    });
  };

  const batchFetchArtworkForSelected = async () => {
    if (!user || selectedItems.size === 0) return;

    setIsBatchFetching(true);
    try {
      const selectedItemsList = Array.from(selectedItems).map(itemId => {
        return items.find(i => i.id === itemId);
      }).filter(Boolean);

      let successCount = 0;
      const totalCount = selectedItemsList.length;

      for (const item of selectedItemsList) {
        if (!item || (!item.discogs_url && (!item.artist || !item.title))) continue;

        try {
          const { data, error } = await supabase.functions.invoke('fetch-album-artwork', {
            body: {
              discogs_url: item.discogs_url,
              artist: item.artist,
              title: item.title,
              media_type: item.media_type,
              item_id: item.id,
            }
          });

          if (!error && data?.success) {
            successCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error fetching artwork for ${item.artist} - ${item.title}:`, error);
        }
      }

      toast({
        title: "Artwork zoeken voltooid",
        description: `${totalCount} items verwerkt, ${successCount} artwork gevonden.`,
      });

      setSelectedItems(new Set());
      setBulkAction("");

      // Refresh the collection to show new artwork
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error batch fetching artwork for selected:', error);
      toast({
        title: "Fout bij artwork zoeken",
        description: "Er is een fout opgetreden bij het zoeken naar artwork.",
        variant: "destructive",
      });
    } finally {
      setIsBatchFetching(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const batchFetchArtwork = async () => {
    if (!user) return;

    setIsBatchFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-fetch-artwork', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: "Artwork zoeken voltooid",
        description: `${data.total_processed} items verwerkt, ${data.success_count} artwork gevonden.`,
      });

      // Refresh the collection to show new artwork
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error batch fetching artwork:', error);
      toast({
        title: "Fout bij artwork zoeken",
        description: "Er is een fout opgetreden bij het automatisch zoeken naar artwork.",
        variant: "destructive",
      });
    } finally {
      setIsBatchFetching(false);
    }
  };

  // Quick action handlers
  const handleMakePublic = async () => {
    if (selectedItems.size === 0) return;
    
    const selectedItemsData = Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return { id: itemId, media_type: item!.media_type };
    });
    
    bulkUpdate({ items: selectedItemsData, updates: { is_public: true } }, {
      onSuccess: () => {
        toast({ title: "Items zijn nu publiek zichtbaar" });
        setSelectedItems(new Set());
      },
      onError: (error) => {
        toast({ title: "Fout bij bijwerken", description: "Er is een fout opgetreden.", variant: "destructive" });
      },
    });
  };

  const handleMakeForSale = async () => {
    if (selectedItems.size === 0) return;
    
    const selectedItemsData = Array.from(selectedItems).map(itemId => {
      const item = items.find(i => i.id === itemId);
      return { id: itemId, media_type: item!.media_type };
    });
    
    bulkUpdate({ items: selectedItemsData, updates: { is_for_sale: true, is_public: true } }, {
      onSuccess: () => {
        toast({ title: "Items staan nu te koop" });
        setSelectedItems(new Set());
      },
      onError: (error) => {
        toast({ title: "Fout bij bijwerken", description: "Er is een fout opgetreden.", variant: "destructive" });
      },
    });
  };

  const stats = {
    total: items.length,
    public: items.filter(item => item.is_public).length,
    forSale: items.filter(item => item.is_for_sale).length,
    private: items.filter(item => !item.is_public && !item.is_for_sale).length,
  };

  if (isLoading) {
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
        <Card className="p-8 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Mijn Collectie
              </h1>
            </div>
            
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Beheer je muziekcollectie, maak items publiek zichtbaar of zet ze te koop in je winkel.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={batchFetchArtwork}
                disabled={isBatchFetching || items.length === 0}
                className="inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isBatchFetching ? "Artwork wordt gezocht..." : "Zoek artwork voor alle items"}
              </Button>

              {/* Quick Links to Public Pages */}
              {stats.public > 0 && (
                <Button variant="outline" asChild>
                  <Link to={`/collection/${user?.id}`} className="inline-flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Bekijk Publieke Collectie
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </Button>
              )}
              
              {shop?.is_public && stats.forSale > 0 && (
                <Button variant="outline" asChild>
                  <Link to={`/shop/${shop.shop_url_slug}`} className="inline-flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Bekijk Winkel
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Shop URL Example */}
            {shop?.is_public && shop.shop_url_slug && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Je winkel URL:</p>
                <code className="text-xs bg-background/50 px-2 py-1 rounded">
                  {window.location.origin}/shop/{shop.shop_url_slug}
                </code>
              </div>
            )}
          </div>
        </Card>

        {/* Price Warnings */}
        {(() => {
          const itemsForSaleWithoutPrice = items.filter(item => 
            item.is_for_sale && (!item.marketplace_price || item.marketplace_price === 0)
          );
          
          if (itemsForSaleWithoutPrice.length > 0) {
            return (
              <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-200">
                  Items zonder prijs in winkel
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  Je hebt {itemsForSaleWithoutPrice.length} item(s) die te koop staan maar geen prijs hebben.
                  Deze items kunnen niet gekocht worden in je publieke winkel.
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Select all items without price
                        const itemIds = new Set(itemsForSaleWithoutPrice.map(item => item.id));
                        setSelectedItems(itemIds);
                      }}
                      className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-200 dark:border-orange-600 dark:hover:bg-orange-900"
                    >
                      Selecteer items zonder prijs
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.public}</div>
            <div className="text-sm text-muted-foreground">Publiek</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.forSale}</div>
            <div className="text-sm text-muted-foreground">Te koop</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.private}</div>
            <div className="text-sm text-muted-foreground">Privé</div>
          </Card>
        </div>

        {/* Filters and Bulk Actions */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-4 flex-1">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle items ({stats.total})</SelectItem>
                  <SelectItem value="public">Publieke items ({stats.public})</SelectItem>
                  <SelectItem value="for_sale">Te koop ({stats.forSale})</SelectItem>
                  <SelectItem value="private">Privé items ({stats.private})</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={selectAll}
                className="whitespace-nowrap"
              >
                {selectedItems.size === items.length ? "Deselecteer alles" : "Selecteer alles"}
              </Button>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex flex-col gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} geselecteerd
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems(new Set())}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Deselecteer alles
                  </Button>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleMakePublic}
                    disabled={isBulkUpdating || isBatchFetching}
                    variant="outline"
                    className="inline-flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
                  >
                    <Globe className="w-4 h-4" />
                    Maak Publiek
                  </Button>
                  
                  <Button
                    onClick={handleMakeForSale}
                    disabled={isBulkUpdating || isBatchFetching}
                    variant="outline"
                    className="inline-flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Zet Te Koop
                  </Button>
                  
                  <Button
                    onClick={() => batchFetchArtworkForSelected()}
                    disabled={isBulkUpdating || isBatchFetching}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Zoek Artwork
                  </Button>

                  {/* Legacy dropdown for other actions */}
                  <div className="flex items-center gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Meer acties..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="make_private">Maak privé</SelectItem>
                        <SelectItem value="remove_from_shop">Haal uit winkel</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || isBulkUpdating || isBatchFetching}
                      size="sm"
                      variant="ghost"
                    >
                      {(isBulkUpdating || isBatchFetching) ? "Bezig..." : "Uitvoeren"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Items Grid */}
        {items.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <Music className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen items gevonden</h3>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "Je hebt nog geen items gescand. Ga naar de scanner om je eerste items toe te voegen."
                : "Geen items gevonden voor het geselecteerde filter."
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    className="bg-background border-2 shadow-sm"
                  />
                </div>
                
                {/* Status Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                  {item.is_for_sale && (
                    <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600 text-white">
                      Te Koop
                    </Badge>
                  )}
                  {item.is_public && !item.is_for_sale && (
                    <Badge variant="secondary" className="text-xs bg-green-500 hover:bg-green-600 text-white">
                      Publiek
                    </Badge>
                  )}
                  {!item.is_public && !item.is_for_sale && (
                    <Badge variant="outline" className="text-xs">
                      Privé
                    </Badge>
                  )}
                </div>
                
                <CollectionItemCard
                  item={item}
                  onUpdate={(updates) => handleItemUpdate(item.id, item.media_type, updates)}
                  isUpdating={isUpdating}
                  showControls={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}