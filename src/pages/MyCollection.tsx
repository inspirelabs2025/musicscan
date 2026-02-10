import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Search, X, Disc3, Disc, Euro, ShoppingCart, ScanLine, TrendingUp, Eye, EyeOff, Package } from "lucide-react";
import { useMyCollection, CollectionItem } from "@/hooks/useMyCollection";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ErrorBoundary, CollectionErrorFallback } from "@/components/ErrorBoundary";

const CollectionCard = ({ item }: { item: CollectionItem }) => {
  const imageUrl = item.front_image || item.catalog_image || item.back_image || item.matrix_image;
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-border/50 hover:border-primary/30">
      {/* Cover Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${item.artist} - ${item.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Music className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Media type badge */}
        <Badge variant="secondary" className="absolute top-2 right-2 text-xs backdrop-blur-sm bg-background/70">
          {item.media_type === 'cd' ? (
            <><Disc className="w-3 h-3 mr-1" />CD</>
          ) : (
            <><Disc3 className="w-3 h-3 mr-1" />Vinyl</>
          )}
        </Badge>
        
        {/* Price overlay */}
        {item.calculated_advice_price != null && item.calculated_advice_price > 0 && (
          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-semibold backdrop-blur-sm">
            €{item.calculated_advice_price.toFixed(2)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm leading-tight line-clamp-1">
          {item.title || 'Onbekende titel'}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.artist || 'Onbekende artiest'}
        </p>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.condition_grade && item.condition_grade !== 'Not Graded' && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {item.condition_grade}
            </Badge>
          )}
          {item.is_for_sale && (
            <Badge className="text-xs px-1.5 py-0 bg-green-600 hover:bg-green-700">
              <ShoppingCart className="w-2.5 h-2.5 mr-0.5" />Te koop
            </Badge>
          )}
          {item.year && (
            <span className="text-xs text-muted-foreground">{item.year}</span>
          )}
        </div>
        
        {/* Price range */}
        {(item.lowest_price || item.highest_price) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>
              {item.lowest_price ? `€${item.lowest_price.toFixed(2)}` : '?'}
              {' – '}
              {item.highest_price ? `€${item.highest_price.toFixed(2)}` : '?'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function MyCollection() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "cd" | "vinyl">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "public" | "for_sale" | "private" | "ready_for_shop">("all");

  const { items, isLoading } = useMyCollection(statusFilter === "all" ? "all" : statusFilter);

  // Client-side filtering for search and media type, sorted newest first
  const filteredItems = items
    .filter(item => {
      if (mediaFilter !== "all" && item.media_type !== mediaFilter) return false;
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const match = [item.artist, item.title, item.label, item.catalog_number]
          .some(f => f?.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Stats
  const totalValue = items
    .filter(i => i.calculated_advice_price && i.calculated_advice_price > 0)
    .reduce((sum, i) => sum + (i.calculated_advice_price || 0), 0);
  const cdCount = items.filter(i => i.media_type === 'cd').length;
  const vinylCount = items.filter(i => i.media_type === 'vinyl').length;
  const forSaleCount = items.filter(i => i.is_for_sale).length;

  const handleSearch = () => setActiveSearch(searchTerm);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setSearchTerm(""); setActiveSearch(""); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-muted animate-pulse rounded-lg mx-auto w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4"><div className="h-12 bg-muted animate-pulse rounded" /></Card>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}><div className="aspect-square bg-muted animate-pulse" /><div className="p-3 space-y-2"><div className="h-4 bg-muted animate-pulse rounded w-3/4" /><div className="h-3 bg-muted animate-pulse rounded w-1/2" /></div></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<CollectionErrorFallback />}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Mijn Collectie</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} items{totalValue > 0 ? ` · Totale waarde €${totalValue.toFixed(2)}` : ''}
              </p>
            </div>
            <Button asChild>
              <Link to="/ai-scan-v2" className="flex items-center gap-2">
                <ScanLine className="w-4 h-4" />
                Scan toevoegen
              </Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{items.length}</div>
                <div className="text-xs text-muted-foreground">Totaal</div>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold">€{totalValue.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Waarde</div>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Disc className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{cdCount}</div>
                <div className="text-xs text-muted-foreground">CD's</div>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Disc3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{vinylCount}</div>
                <div className="text-xs text-muted-foreground">Vinyl</div>
              </div>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op artiest, titel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
              {activeSearch && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setActiveSearch(""); }} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Select value={mediaFilter} onValueChange={(v) => setMediaFilter(v as any)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alles</SelectItem>
                <SelectItem value="cd">CD</SelectItem>
                <SelectItem value="vinyl">Vinyl</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle items</SelectItem>
                <SelectItem value="for_sale">Te koop</SelectItem>
                <SelectItem value="public">Publiek</SelectItem>
                <SelectItem value="private">Privé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Collection Grid */}
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center">
              <Music className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {activeSearch ? 'Geen resultaten' : 'Nog geen items in je collectie'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {activeSearch 
                  ? `Geen items gevonden voor "${activeSearch}"`
                  : 'Scan je eerste CD of LP met Magic Mike en sla het op om je collectie te starten.'
                }
              </p>
              {!activeSearch && (
                <Button asChild>
                  <Link to="/ai-scan-v2">
                    <ScanLine className="w-4 h-4 mr-2" />
                    Start met scannen
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
