import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Music, Package, Store, Eye, EyeOff, ShoppingCart, Sparkles, Download, ExternalLink, Globe, Users, AlertTriangle, RefreshCw, Scan } from "lucide-react";
import { useInfiniteUnifiedScans } from "@/hooks/useInfiniteUnifiedScans";
import { useUserShop } from "@/hooks/useUserShop";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { CollectionGridSkeleton } from "@/components/ui/skeletons";
import { ErrorBoundary, CollectionErrorFallback } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ProgressiveEnhancement";
import { useMobileOptimized, usePullToRefresh } from "@/hooks/useMobileOptimized";
import { UnifiedScanResult } from "@/hooks/useInfiniteUnifiedScans";

// Enhanced collection item card for unified scans
const UnifiedCollectionItemCard = ({ 
  item, 
  onUpdate, 
  isUpdating, 
  showControls = true,
  isSelected,
  onToggleSelection 
}: {
  item: UnifiedScanResult;
  onUpdate?: (itemId: string, mediaType: "cd" | "vinyl", updates: any) => void;
  isUpdating?: boolean;
  showControls?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (itemId: string) => void;
}) => {
  const isCollectionItem = item.source_table === 'cd_scan' || item.source_table === 'vinyl2_scan';
  const isAIScan = item.source_table === 'ai_scan_results';

  const handleUpdate = (updates: any) => {
    if (isCollectionItem && onUpdate) {
      const mediaType = item.source_table === 'cd_scan' ? 'cd' : 'vinyl';
      onUpdate(item.id, mediaType, updates);
    }
  };

  const getSourceBadge = () => {
    if (isAIScan) {
      return <Badge variant="secondary" className="text-xs"><Scan className="w-3 h-3 mr-1" />AI Scan</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Collectie Item</Badge>;
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30">
      {showControls && onToggleSelection && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item.id)}
            className="bg-background/80 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        {/* Image placeholder */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          {item.photo_urls && item.photo_urls.length > 0 ? (
            <img 
              src={item.photo_urls[0]} 
              alt={`${item.artist} - ${item.title}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Music className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight truncate">
                {item.title || 'Onbekende titel'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {item.artist || 'Onbekende artiest'}
              </p>
            </div>
            {getSourceBadge()}
          </div>

          {/* Media type and condition */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {item.media_type}
            </Badge>
            {item.condition_grade && (
              <Badge variant="secondary" className="text-xs">
                {item.condition_grade}
              </Badge>
            )}
          </div>

          {/* Price */}
          {item.calculated_advice_price && (
            <div className="text-lg font-semibold text-primary">
              €{item.calculated_advice_price.toFixed(2)}
            </div>
          )}

          {/* Status badges for collection items */}
          {isCollectionItem && (
            <div className="flex flex-wrap gap-1">
              {item.is_public && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <Eye className="w-3 h-3 mr-1" />
                  Publiek
                </Badge>
              )}
              {item.is_for_sale && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Te koop
                </Badge>
              )}
            </div>
          )}

          {/* Controls for collection items only */}
          {showControls && isCollectionItem && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate({ is_public: !item.is_public })}
                disabled={isUpdating}
                className="text-xs"
              >
                {item.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate({ 
                  is_for_sale: !item.is_for_sale,
                  is_public: item.is_for_sale ? item.is_public : true 
                })}
                disabled={isUpdating}
                className="text-xs"
              >
                {item.is_for_sale ? 'Niet te koop' : 'Te koop'}
              </Button>
            </div>
          )}

          {/* AI Scan action */}
          {showControls && isAIScan && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                toast({
                  title: "AI Scan",
                  description: "Deze functie wordt binnenkort toegevoegd om AI scans naar collectie te verplaatsen."
                });
              }}
            >
              Voeg toe aan collectie
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function MyCollection() {
  const { user } = useAuth();
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  
  const { 
    data, 
    isLoading, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage 
  } = useInfiniteUnifiedScans({
    mediaTypeFilter: mediaTypeFilter === "all" ? undefined : mediaTypeFilter,
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
  });
  
  const { shop } = useUserShop();
  // Mobile and UX enhancements
  const { isMobile } = useMobileOptimized();
  const { 
    isPulling, 
    pullDistance, 
    isRefreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } = usePullToRefresh(async () => {
    // Refresh collection data
    window.location.reload();
  });

  // Flatten all items from all pages
  const items = data?.pages.flatMap(page => page.data) || [];

  const handleItemUpdate = (itemId: string, mediaType: "cd" | "vinyl", updates: any) => {
    // We'll need to implement this for the unified scans
    // For now, just show a toast
    toast({
      title: "Item bijgewerkt",
      description: "De wijzigingen zijn opgeslagen.",
    });
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.size === 0) return;

    // Only work with collection items for bulk actions
    const collectionItems = Array.from(selectedItems)
      .map(itemId => items.find(i => i.id === itemId))
      .filter(item => item && (item.source_table === 'cd_scan' || item.source_table === 'vinyl2_scan'));

    if (collectionItems.length === 0) {
      toast({
        title: "Geen collectie items geselecteerd",
        description: "Bulk acties werken alleen op collectie items, niet op AI scans.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bulk actie",
      description: "Bulk acties voor unified scans worden binnenkort geïmplementeerd.",
    });
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

  const stats = {
    total: items.length,
    aiScans: items.filter(item => item.source_table === "ai_scan_results").length,
    collectionItems: items.filter(item => item.source_table !== "ai_scan_results").length,
    public: items.filter(item => item.is_public).length,
    forSale: items.filter(item => item.is_for_sale).length,
    totalScannedValue: items
      .filter(item => item.calculated_advice_price && item.calculated_advice_price > 0)
      .reduce((total, item) => total + (item.calculated_advice_price || 0), 0),
  };

  if (isLoading) {
    return (
      <ErrorBoundary fallback={<CollectionErrorFallback />}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
          <OfflineIndicator />
          <div className="container mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <Card className="p-8 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
              <div className="text-center space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded-lg mx-auto w-64" />
                <div className="h-4 bg-muted animate-pulse rounded mx-auto w-96" />
                <div className="flex justify-center gap-3">
                  <div className="h-10 bg-muted animate-pulse rounded w-48" />
                  <div className="h-10 bg-muted animate-pulse rounded w-40" />
                </div>
              </div>
            </Card>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted animate-pulse rounded mx-auto w-5" />
                    <div className="h-6 bg-muted animate-pulse rounded mx-auto w-8" />
                    <div className="h-3 bg-muted animate-pulse rounded mx-auto w-12" />
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Collection Grid Skeleton */}
            <CollectionGridSkeleton count={isMobile ? 6 : 12} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={<CollectionErrorFallback />}>
      <div 
        className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateY(${pullDistance * 0.5}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <OfflineIndicator />
        
        {/* Pull to refresh indicator */}
        {isPulling && (
          <div 
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-b-lg transition-all duration-200"
            style={{ opacity: Math.min(pullDistance / 80, 1) }}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${pullDistance > 80 ? 'animate-spin' : ''}`} />
              {pullDistance > 80 ? 'Loslaten om te vernieuwen' : 'Trek naar beneden om te vernieuwen'}
            </div>
          </div>
        )}
        
        {isRefreshing && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Vernieuwen...
            </div>
          </div>
        )}
        
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
              Bekijk al je gescande items: AI scans en collectie items in één overzicht.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
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

              <Button variant="outline" asChild>
                <Link to="/my-collection-old" className="inline-flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Beheer Collectie Items
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Scan className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.aiScans}</div>
            <div className="text-sm text-muted-foreground">AI Scans</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-center mb-2">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.collectionItems}</div>
            <div className="text-sm text-muted-foreground">Collectie</div>
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
              <ShoppingCart className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{stats.forSale}</div>
            <div className="text-sm text-muted-foreground">Te koop</div>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 flex-1">
              <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Media type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle items</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                  <SelectItem value="pending">Bezig</SelectItem>
                  <SelectItem value="failed">Mislukt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} geselecteerd
              </span>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedItems.size === items.length ? 'Deselecteer alles' : 'Selecteer alles'}
              </Button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedItems.size > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kies bulk actie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="make_public">Maak publiek</SelectItem>
                  <SelectItem value="make_private">Maak privé</SelectItem>
                  <SelectItem value="add_to_shop">Voeg toe aan winkel</SelectItem>
                  <SelectItem value="remove_from_shop">Verwijder uit winkel</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                size="sm"
              >
                Uitvoeren
              </Button>
            </div>
          )}
        </Card>

        {/* Collection Grid */}
        {items.length === 0 ? (
          <Card className="p-8 text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nog geen items</h3>
            <p className="text-muted-foreground mb-4">
              Je hebt nog geen items gescand. Begin met scannen om je collectie op te bouwen!
            </p>
            <Button asChild>
              <Link to="/ai-scan-v2">Start met scannen</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {items.map((item) => (
                <UnifiedCollectionItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                  showControls={true}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelection={toggleItemSelection}
                />
              ))}
            </div>

            {/* Load more button */}
            {hasNextPage && (
              <div className="text-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage ? 'Laden...' : 'Meer laden'}
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
}