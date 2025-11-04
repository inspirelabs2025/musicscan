import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Search, Heart, Mail, ArrowLeft, Users, Package } from "lucide-react";
import { usePublicShop } from "@/hooks/usePublicShop";
import { useShopViewCounter } from "@/hooks/useShopViewCounter";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { ShopItemCard } from "@/components/ShopItemCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PublicShop() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { shop, items, isLoading } = usePublicShop(shopSlug || "");
  const { incrementViewCount } = useShopViewCounter();
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const navigate = useNavigate();

  // Increment view count when shop loads
  useEffect(() => {
    if (shop && shopSlug) {
      incrementViewCount(shopSlug);
    }
  }, [shop, shopSlug, incrementViewCount]);

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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        {/* Loading Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 text-6xl opacity-10 animate-pulse">🎵</div>
          <div className="absolute top-20 right-10 text-4xl opacity-10 animate-bounce delay-300">🎶</div>
          <div className="absolute bottom-10 left-10 text-4xl opacity-10 animate-pulse delay-500">🎧</div>
        </div>
        
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        {/* Animated Musical Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 text-6xl opacity-10 animate-pulse">🎵</div>
          <div className="absolute top-20 right-10 text-4xl opacity-10 animate-bounce delay-300">🎶</div>
          <div className="absolute bottom-10 left-10 text-4xl opacity-10 animate-pulse delay-500">🎧</div>
        </div>
        
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <Card className="p-12 text-center bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
            <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">🏪 Winkel niet gevonden</h3>
            <p className="text-muted-foreground">
              De winkel die je zoekt bestaat niet of is niet publiek zichtbaar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />
      
      {/* Animated Musical Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 text-6xl opacity-10 animate-pulse">🎵</div>
        <div className="absolute top-20 right-10 text-4xl opacity-10 animate-bounce delay-300">🎶</div>
        <div className="absolute top-1/3 left-1/4 text-5xl opacity-10 animate-pulse delay-700">🎼</div>
        <div className="absolute bottom-1/4 right-1/3 text-3xl opacity-10 animate-bounce delay-1000">🎤</div>
        <div className="absolute bottom-10 left-10 text-4xl opacity-10 animate-pulse delay-500">🎧</div>
        <div className="absolute top-1/2 right-1/4 text-2xl opacity-10 animate-bounce delay-1200">🎹</div>
      </div>

      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        {/* Enhanced Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(-1)} 
                className="w-fit bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-vinyl-purple to-vinyl-gold bg-clip-text text-transparent animate-fade-in">
                  🏪 {shop.shop_name || "Muziekwinkel"}
                </h1>
                {shop.shop_description && (
                  <p className="text-sm sm:text-base text-muted-foreground animate-fade-in animation-delay-200">
                    ✨ {shop.shop_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Shop Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card className="group bg-gradient-to-br from-vinyl-purple/20 to-card/80 backdrop-blur-sm border border-vinyl-purple/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
                <p className="text-sm text-muted-foreground">📦 Items te koop</p>
              </div>
              <Package className="h-8 w-8 text-vinyl-purple" />
            </div>
          </Card>

          <Card className="group bg-gradient-to-br from-vinyl-gold/20 to-card/80 backdrop-blur-sm border border-vinyl-gold/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{shop.view_count}</p>
                <p className="text-sm text-muted-foreground">👥 Bezoekers</p>
              </div>
              <Users className="h-8 w-8 text-vinyl-gold" />
            </div>
          </Card>

          <Card className="group bg-gradient-to-br from-primary/20 to-card/80 backdrop-blur-sm border border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {items.filter(item => item.media_type === "cd").length} CD's
                </p>
                <p className="text-lg font-bold text-foreground">
                  {items.filter(item => item.media_type === "vinyl").length} LP's
                </p>
                <p className="text-lg font-bold text-foreground">
                  {items.filter(item => item.media_type === "art").length} Art
                </p>
              </div>
              <Store className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="group bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="🔍 Zoek op artiest, titel, of label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={formatFilter === "all" ? "default" : "outline"}
                onClick={() => setFormatFilter("all")}
                size="sm"
                className={formatFilter === "all" 
                  ? "bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-scale" 
                  : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                }
              >
                🎵 Alle ({items.length})
              </Button>
              <Button
                variant={formatFilter === "cd" ? "default" : "outline"}
                onClick={() => setFormatFilter("cd")}
                size="sm"
                className={formatFilter === "cd" 
                  ? "bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-scale" 
                  : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                }
              >
                💿 CD's ({items.filter(item => item.media_type === "cd").length})
              </Button>
              <Button
                variant={formatFilter === "vinyl" ? "default" : "outline"}
                onClick={() => setFormatFilter("vinyl")}
                size="sm"
                className={formatFilter === "vinyl" 
                  ? "bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-scale" 
                  : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                }
              >
                🎧 Vinyl ({items.filter(item => item.media_type === "vinyl").length})
              </Button>
              <Button
                variant={formatFilter === "art" ? "default" : "outline"}
                onClick={() => setFormatFilter("art")}
                size="sm"
                className={formatFilter === "art" 
                  ? "bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-scale" 
                  : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                }
              >
                🎨 Art ({items.filter(item => item.media_type === "art").length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Enhanced Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg animate-fade-in">
            <Store className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {items.length === 0 ? "🎵 Geen items te koop" : "🔍 Geen resultaten"}
            </h3>
            <p className="text-muted-foreground">
              {items.length === 0 
                ? "Deze winkel heeft momenteel geen items te koop."
                : "Probeer een andere zoekopdracht of filter."
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8 animate-fade-in">
            {filteredItems.map((item, index) => (
              <div key={item.id} className="group hover-scale" style={{ animationDelay: `${index * 50}ms` }}>
                <ShopItemCard
                  item={item}
                  shopContactInfo={shop.contact_info}
                />
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Contact Info */}
        {shop.contact_info && (
          <Card className="group bg-gradient-to-r from-vinyl-gold/20 to-card/80 backdrop-blur-sm border border-vinyl-gold/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale p-6 animate-fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-vinyl-gold mr-2" />
                <h3 className="text-lg font-semibold bg-gradient-to-r from-vinyl-gold to-yellow-600 bg-clip-text text-transparent">
                  📧 Contact
                </h3>
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