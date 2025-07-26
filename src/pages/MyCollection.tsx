import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Package, Store, Eye, EyeOff, ShoppingCart, Sparkles, Download } from "lucide-react";
import { useMyCollection } from "@/hooks/useMyCollection";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function MyCollection() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "public" | "for_sale" | "private">("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  
  const { items, isLoading, updateItem, isUpdating, bulkUpdate, isBulkUpdating } = useMyCollection(filter);
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
        {/* Header with Artwork Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Mijn Collectie
            </h1>
            <p className="text-muted-foreground">
              Beheer je muziekcollectie, maak items publiek zichtbaar of zet ze te koop in je persoonlijke winkel.
            </p>
          </div>
          
          <Button
            onClick={batchFetchArtwork}
            disabled={isBatchFetching}
            variant="outline"
            className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10"
          >
            {isBatchFetching ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Artwork zoeken...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Automatisch artwork zoeken
              </>
            )}
          </Button>
        </div>

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
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedItems.size} geselecteerd
                </Badge>
                
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Bulk actie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="make_public">Maak publiek</SelectItem>
                    <SelectItem value="make_private">Maak privé</SelectItem>
                    <SelectItem value="add_to_shop">Zet te koop</SelectItem>
                    <SelectItem value="remove_from_shop">Haal uit winkel</SelectItem>
                    <SelectItem value="fetch_artwork">Zoek artwork</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || isBulkUpdating || isBatchFetching}
                  className="whitespace-nowrap"
                >
                  {(isBulkUpdating || isBatchFetching) ? "Bezig..." : "Uitvoeren"}
                </Button>
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