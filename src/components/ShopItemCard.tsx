import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Heart, Mail, ExternalLink, AlertTriangle, Disc, Music2, Sparkles } from "lucide-react";
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

  const getMediaTypeIcon = () => {
    return item.media_type === 'vinyl' ? Disc : Music2;
  };

  const MediaIcon = getMediaTypeIcon();

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-card/80 backdrop-blur-sm border border-white/20 hover:border-vinyl-purple/50 transition-all duration-500 hover:shadow-2xl hover:shadow-vinyl-purple/25 hover-scale animate-fade-in">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/10 via-transparent to-vinyl-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Sparkle effects */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="w-4 h-4 text-vinyl-gold animate-pulse" />
      </div>

      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/10">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${item.artist} - ${item.title}`}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vinyl-purple/30 to-vinyl-gold/20 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
            <MediaIcon className="w-16 h-16 text-white/60 relative z-10 group-hover:animate-pulse" />
            {/* Vinyl record effect */}
            {item.media_type === 'vinyl' && (
              <div className="absolute inset-0 rounded-full border-4 border-white/20 m-8 group-hover:animate-spin-slow"></div>
            )}
          </div>
        )}
        
        {/* Enhanced overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/20 via-transparent to-vinyl-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <Badge 
            variant="secondary" 
            className="text-xs font-bold bg-gradient-to-r from-vinyl-purple to-primary text-white border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
          >
            {item.media_type === 'vinyl' ? '🎧 VINYL' : '💿 CD'}
          </Badge>
          {item.condition_grade && (
            <Badge 
              variant={getConditionColor(item.condition_grade)} 
              className="text-xs font-semibold bg-white/90 text-gray-800 border-0 shadow-lg backdrop-blur-sm"
            >
              {item.condition_grade}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className="h-9 w-9 p-0 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 hover:border-red-400/50 transition-all duration-300 hover-scale"
          >
            <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-white hover:text-red-400'}`} />
          </Button>
        </div>

        {/* Enhanced price overlay */}
        {item.marketplace_price ? (
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-vinyl-gold to-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-xl border border-yellow-300/30 z-10 hover-scale">
            💰 {item.currency}{item.marketplace_price}
          </div>
        ) : item.calculated_advice_price ? (
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-vinyl-purple/90 to-primary/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/20 z-10 hover-scale">
            💎 ~{item.currency}{item.calculated_advice_price}
          </div>
        ) : (
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-red-300/30 z-10 flex items-center gap-1 hover-scale">
            <AlertTriangle className="w-3 h-3" />
            📧 Op aanvraag
          </div>
        )}
      </div>

      <div className="p-5 space-y-4 relative">
        {/* Artist and title with enhanced typography */}
        <div className="space-y-2">
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-vinyl-purple transition-colors duration-300">
            🎤 {item.artist || "Onbekende artiest"}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 font-medium">
            🎵 {item.title || "Onbekende titel"}
          </p>
          {item.label && (
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              <Music className="w-3 h-3" />
              {item.label} {item.year && `(${item.year})`}
            </p>
          )}
        </div>

        {/* Enhanced shop description */}
        {item.shop_description && (
          <div className="text-xs text-muted-foreground line-clamp-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10 italic">
            💬 "{item.shop_description}"
          </div>
        )}

        {/* Enhanced action buttons */}
        <div className="flex gap-2 pt-2">
          {shopContactInfo && (
            <Button
              size="sm"
              onClick={handleContact}
              className="flex-1 text-xs font-semibold bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-scale border border-white/20"
            >
              <Mail className="w-3 h-3 mr-2" />
              {(item.marketplace_price || item.calculated_advice_price) ? '🛒 Kopen' : '💌 Contact'}
            </Button>
          )}
          
          {item.discogs_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(item.discogs_url!, '_blank')}
              className="text-xs font-semibold bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-vinyl-gold/50 transition-all duration-300 hover-scale"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">🔗 Info</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Card>
  );
};