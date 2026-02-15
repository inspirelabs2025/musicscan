import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Store, Filter, ArrowUpDown, Loader2, Package, Euro, Calendar, Grid3x3 } from "lucide-react";
import { usePublicMarketplace, type MarketplaceItem } from "@/hooks/usePublicMarketplace";
import { ShopItemCard } from "@/components/ShopItemCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "artist" | "title";
type FilterOption = "all" | "cd" | "vinyl";

export default function Marketplace() {
  const { items, isLoading } = usePublicMarketplace();
  const { tr } = useLanguage();
  const m = tr.marketplace;
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterBy !== "all" && item.media_type !== filterBy) return false;
    if (priceRange.min && item.marketplace_price && item.marketplace_price < priceRange.min) return false;
    if (priceRange.max && item.marketplace_price && item.marketplace_price > priceRange.max) return false;
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price-low":
        return (a.marketplace_price || 0) - (b.marketplace_price || 0);
      case "price-high":
        return (b.marketplace_price || 0) - (a.marketplace_price || 0);
      case "artist":
        return (a.artist || "").localeCompare(b.artist || "");
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    totalItems: items.length,
    cdCount: items.filter(item => item.media_type === "cd").length,
    vinylCount: items.filter(item => item.media_type === "vinyl").length,
    averagePrice: items.reduce((sum, item) => sum + (item.marketplace_price || 0), 0) / items.length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{m.metaTitle}</title>
          <meta name="description" content={m.metaDesc} />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">{m.loading}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{m.metaTitle}</title>
        <meta name="description" content={m.metaDesc} />
        <meta name="keywords" content={m.metaKeywords} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{m.title}</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6">{m.subtitle}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <div className="text-sm text-muted-foreground">{m.itemsForSale}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.cdCount}</div>
                <div className="text-sm text-muted-foreground">CD's</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.vinylCount}</div>
                <div className="text-sm text-muted-foreground">Vinyl</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Euro className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">€{stats.averagePrice.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">{m.averagePrice}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={m.allItems} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m.allItems}</SelectItem>
                <SelectItem value="cd">{m.onlyCDs}</SelectItem>
                <SelectItem value="vinyl">{m.onlyVinyl}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{m.newestFirst}</SelectItem>
                <SelectItem value="oldest">{m.oldestFirst}</SelectItem>
                <SelectItem value="price-low">{m.priceLowHigh}</SelectItem>
                <SelectItem value="price-high">{m.priceHighLow}</SelectItem>
                <SelectItem value="artist">{m.artistAZ}</SelectItem>
                <SelectItem value="title">{m.titleAZ}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            <Grid3x3 className="h-4 w-4" />
            {filteredItems.length} {m.ofItems} {items.length} {tr.common.items}
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{m.noItemsFound}</h3>
            <p className="text-muted-foreground">{m.noItemsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems.map((item) => (
              <ShopItemCard 
                key={`${item.media_type}-${item.id}`} 
                item={item}
                shopContactInfo={item.shop_contact_info}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
