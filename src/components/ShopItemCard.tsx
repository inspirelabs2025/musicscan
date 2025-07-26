import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Heart, Mail, ExternalLink, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { CollectionItem } from "@/hooks/useMyCollection";

interface ShopItemCardProps {
  item: CollectionItem;
  shopContactInfo?: string;
}

export const ShopItemCard = ({ item, shopContactInfo }: ShopItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Enhanced image fallback logic based on media type
  const getImageUrl = () => {
    if (item.media_type === 'cd') {
      return item.front_image || item.back_image || item.barcode_image || item.matrix_image;
    } else if (item.media_type === 'vinyl') {
      return item.catalog_image || item.matrix_image || item.additional_image;
    }
    return item.front_image || item.catalog_image;
  };

  const imageUrl = getImageUrl();

  const getConditionColor = (condition: string | null) => {
    if (!condition) return "secondary";
    
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("mint") || lowerCondition.includes("m")) return "default";
    if (lowerCondition.includes("near mint") || lowerCondition.includes("nm")) return "default";
    if (lowerCondition.includes("very good plus") || lowerCondition.includes("vg+")) return "secondary";
    if (lowerCondition.includes("very good") || lowerCondition.includes("vg")) return "outline";
    if (lowerCondition.includes("good plus") || lowerCondition.includes("g+")) return "outline";
    return "destructive";
  };

  const handleContact = () => {
    if (shopContactInfo) {
      // Try to detect if it's an email or other contact method
      if (shopContactInfo.includes('@')) {
        window.location.href = `mailto:${shopContactInfo}?subject=Interesse in: ${item.artist} - ${item.title}`;
      } else {
        // For other contact methods, we could show a modal or copy to clipboard
        navigator.clipboard.writeText(shopContactInfo);
      }
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you could save to localStorage or a favorites system
    const favorites = JSON.parse(localStorage.getItem('shop-favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter((id: string) => id !== item.id);
      localStorage.setItem('shop-favorites', JSON.stringify(newFavorites));
    } else {
      favorites.push(item.id);
      localStorage.setItem('shop-favorites', JSON.stringify(favorites));
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/30 to-background/50">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${item.artist} - ${item.title}`}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/10">
            <Music className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs font-medium">
            {item.media_type.toUpperCase()}
          </Badge>
          {item.condition_grade && (
            <Badge variant={getConditionColor(item.condition_grade)} className="text-xs">
              {item.condition_grade}
            </Badge>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </Button>
        </div>

        {/* Price overlay */}
        {item.marketplace_price ? (
          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {item.currency}{item.marketplace_price}
          </div>
        ) : item.calculated_advice_price ? (
          <div className="absolute bottom-2 right-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            ~{item.currency}{item.calculated_advice_price}
          </div>
        ) : (
          <div className="absolute bottom-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Prijs op aanvraag
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
            {item.artist || "Onbekende artiest"}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 mb-1">
            {item.title || "Onbekende titel"}
          </p>
          {item.label && (
            <p className="text-muted-foreground text-xs">
              {item.label} {item.year && `(${item.year})`}
            </p>
          )}
        </div>

        {item.shop_description && (
          <div className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded">
            {item.shop_description}
          </div>
        )}

        <div className="flex gap-2">
          {shopContactInfo && (
            <Button
              size="sm"
              onClick={handleContact}
              className="flex-1 text-xs"
            >
              <Mail className="w-3 h-3 mr-1" />
              {(item.marketplace_price || item.calculated_advice_price) ? 'Kopen' : 'Interesse?'}
            </Button>
          )}
          
          {item.discogs_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(item.discogs_url!, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};