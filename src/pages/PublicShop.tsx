import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Search, Heart, Mail } from "lucide-react";
import { usePublicShop } from "@/hooks/usePublicShop";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { useState } from "react";

export default function PublicShop() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { shop, items, isLoading } = usePublicShop(shopSlug || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.label?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = formatFilter === "all" || item.media_type === formatFilter;
    
    return matchesSearch && matchesFormat;
  });

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

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Winkel niet gevonden</h3>
            <p className="text-muted-foreground">
              De winkel die je zoekt bestaat niet of is niet publiek zichtbaar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Shop Header */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {shop.shop_name || "Muziekwinkel"}
              </h1>
            </div>
            
            {shop.shop_description && (
              <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
                {shop.shop_description}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>{items.length} items te koop</span>
              <span>•</span>
              <span>{shop.view_count} bezoekers</span>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Zoek op artiest, titel, of label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={formatFilter === "all" ? "default" : "outline"}
                onClick={() => setFormatFilter("all")}
                size="sm"
              >
                Alle ({items.length})
              </Button>
              <Button
                variant={formatFilter === "cd" ? "default" : "outline"}
                onClick={() => setFormatFilter("cd")}
                size="sm"
              >
                CD's ({items.filter(item => item.media_type === "cd").length})
              </Button>
              <Button
                variant={formatFilter === "vinyl" ? "default" : "outline"}
                onClick={() => setFormatFilter("vinyl")}
                size="sm"
              >
                Vinyl ({items.filter(item => item.media_type === "vinyl").length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {items.length === 0 ? "Geen items te koop" : "Geen resultaten"}
            </h3>
            <p className="text-muted-foreground">
              {items.length === 0 
                ? "Deze winkel heeft momenteel geen items te koop."
                : "Probeer een andere zoekopdracht of filter."
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {filteredItems.map((item) => (
              <CollectionItemCard
                key={item.id}
                item={item}
                onUpdate={() => {}} // No updates allowed in public view
                showControls={false}
              />
            ))}
          </div>
        )}

        {/* Contact Info */}
        {shop.contact_info && (
          <Card className="p-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold">Contact</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {shop.contact_info}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}