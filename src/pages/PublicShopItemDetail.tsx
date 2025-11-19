import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Store, 
  Calendar, 
  Tag, 
  Disc, 
  Music, 
  Euro,
  ShoppingCart,
  CreditCard,
  Mail,
  ExternalLink,
  User,
  Eye
} from "lucide-react";
import { useShopItemDetail } from "@/hooks/useShopItemDetail";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useState, useEffect } from "react";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackProductView, trackAddToCart } from "@/utils/googleAnalytics";

export default function PublicShopItemDetail() {
  const { shopSlug, itemId } = useParams<{ shopSlug: string; itemId: string }>();
  const { data, isLoading } = useShopItemDetail(shopSlug || "", itemId || "");
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToCart } = useShoppingCart();
  const { toast } = useToast();

  // Track product view
  useEffect(() => {
    if (data?.item) {
      trackProductView({
        id: data.item.id,
        artist: data.item.artist,
        title: data.item.title,
        price: data.item.marketplace_price || data.item.calculated_advice_price,
        media_type: data.item.media_type,
        categories: ['marketplace', data.item.media_type],
      });
    }
  }, [data]);

  const getImageUrl = () => {
    if (!data?.item) return null;
    
    const item = data.item;
    if (item.media_type === "cd") {
      return item.front_image || item.back_image || item.barcode_image;
    } else {
      return item.catalog_image || item.matrix_image || item.additional_image;
    }
  };

  const getConditionColor = (condition: string | null | undefined) => {
    if (!condition) return "secondary";
    switch (condition.toLowerCase()) {
      case "mint (m)":
        return "default";
      case "near mint (nm or m-)":
        return "default";
      case "very good plus (vg+)":
        return "outline";
      case "very good (vg)":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleBuyNow = async () => {
    if (!data?.item) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Inloggen vereist",
          description: "Je moet ingelogd zijn om items te kopen.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Add to cart and navigate to checkout
      const cartItem = {
        id: data.item.id,
        media_type: data.item.media_type,
        artist: data.item.artist || "",
        title: data.item.title || "",
        price: data.item.marketplace_price || data.item.calculated_advice_price || 0,
        condition_grade: data.item.condition_grade || "",
        seller_id: data.shop.user_id,
        image: getImageUrl() || undefined
      };
      
      trackAddToCart(cartItem);
      addToCart(cartItem);
      toast({
        title: "Toegevoegd aan winkelwagen",
        description: "Het item is toegevoegd aan je winkelwagen.",
      });
      
      // You can add checkout navigation here if needed
      // navigate("/checkout");
    } catch (error) {
      console.error("Error during purchase:", error);
      toast({
        title: "Fout",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!data?.item) return;
    
    const cartItem = {
      id: data.item.id,
      media_type: data.item.media_type,
      artist: data.item.artist || "",
      title: data.item.title || "",
      price: data.item.marketplace_price || data.item.calculated_advice_price || 0,
      condition_grade: data.item.condition_grade || "",
      seller_id: data.shop.user_id,
      image: getImageUrl() || undefined
    };
    
    trackAddToCart(cartItem);
    addToCart(cartItem);
    toast({
      title: "Toegevoegd aan winkelwagen",
      description: `${data.item.artist} - ${data.item.title} is toegevoegd aan je winkelwagen.`,
    });
  };

  const handleContact = () => {
    if (!data?.shop.contact_info) return;
    
    if (data.shop.contact_info.includes("@")) {
      window.location.href = `mailto:${data.shop.contact_info}?subject=Interesse in ${data.item.artist} - ${data.item.title}`;
    } else {
      navigator.clipboard.writeText(data.shop.contact_info);
      toast({
        title: "Gekopieerd!",
        description: "Contactinformatie is gekopieerd naar je klembord.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.item || !data?.shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <Card className="p-12 text-center bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
            <Music className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Item niet gevonden</h3>
            <p className="text-muted-foreground">
              Het item dat je zoekt bestaat niet of is niet beschikbaar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const { item, shop } = data;
  const breadcrumbItems = [
    { name: "Shops", url: "/shops" },
    { name: shop.shop_name || "Shop", url: `/shop/${shopSlug}` },
    { name: `${item.artist} - ${item.title}`, url: "" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation items={breadcrumbItems} className="max-w-7xl mx-auto px-4 pt-4" />
      
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        {/* Header with back navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/shop/${shopSlug}`)} 
            className="w-fit bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar shop
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="w-4 h-4" />
            <span>{shop.shop_name}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Image section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg overflow-hidden">
            <div className="aspect-square relative bg-gradient-to-br from-card to-muted/20">
              {getImageUrl() && !imageError ? (
                <img
                  src={getImageUrl()}
                  alt={`${item.artist} - ${item.title}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                  {item.media_type === "cd" ? (
                    <Disc className="w-24 h-24 text-muted-foreground/30" />
                  ) : (
                    <Music className="w-24 h-24 text-muted-foreground/30" />
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Details section */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg p-6 space-y-4">
              {/* Title and artist */}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-vinyl-purple to-vinyl-gold bg-clip-text text-transparent mb-2">
                  {item.title}
                </h1>
                <p className="text-xl text-foreground/80">{item.artist}</p>
              </div>

              {/* Price and condition */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center text-2xl font-bold text-primary">
                  <Euro className="w-6 h-6 mr-1" />
                  {item.marketplace_price || item.calculated_advice_price || "N/A"}
                </div>
                {item.condition_grade && (
                  <Badge variant={getConditionColor(item.condition_grade)} className="text-sm">
                    {item.condition_grade}
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  {item.media_type === "cd" ? "💿 CD" : "🎧 Vinyl"}
                </Badge>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleBuyNow}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {actionLoading ? "Bezig..." : "Koop Nu"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleAddToCart}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  In Winkelwagen
                </Button>
              </div>

              {/* Contact button */}
              {shop.contact_info && (
                <Button
                  variant="outline"
                  onClick={handleContact}
                  className="w-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact verkoper
                </Button>
              )}
            </Card>

            {/* Item details */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {item.label && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Label:</span>
                    <span>{item.label}</span>
                  </div>
                )}
                {item.catalog_number && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Catalogus:</span>
                    <span>{item.catalog_number}</span>
                  </div>
                )}
                {item.year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Jaar:</span>
                    <span>{item.year}</span>
                  </div>
                )}
                {item.discogs_url && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={item.discogs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Discogs info
                    </a>
                  </div>
                )}
              </div>

              {item.shop_description && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-2">Beschrijving</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">
                    {item.shop_description}
                  </p>
                </div>
              )}
            </Card>

            {/* Shop info */}
            <Card className="bg-gradient-to-r from-vinyl-gold/20 to-card/80 backdrop-blur-sm border border-vinyl-gold/30 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-vinyl-gold" />
                  <div>
                    <h4 className="font-semibold">{shop.shop_name}</h4>
                    {shop.shop_description && (
                      <p className="text-sm text-muted-foreground">{shop.shop_description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/shop/${shopSlug}`)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-vinyl-gold/20 hover:border-vinyl-gold/50 transition-all duration-300"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Meer items
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}