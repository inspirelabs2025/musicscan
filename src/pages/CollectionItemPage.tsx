import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DiscogsExportDialog } from "@/components/collection/DiscogsExportDialog";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import {
  ArrowLeft, Disc, Disc3, Music, ExternalLink, TrendingUp,
  Euro, ShoppingCart, Upload, MapPin, Tag, Calendar, Hash,
  Barcode, Layers, Image as ImageIcon, Info
} from "lucide-react";
import { useState } from "react";

export default function CollectionItemPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected } = useDiscogsConnection();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["collection-item", id],
    queryFn: async () => {
      if (!user?.id || !id) return null;

      // Try CD first
      const { data: cd } = await supabase
        .from("cd_scan")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cd) return { ...cd, media_type: "cd" as const };

      // Try vinyl
      const { data: vinyl } = await supabase
        .from("vinyl2_scan")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (vinyl) return { ...vinyl, media_type: "vinyl" as const };

      return null;
    },
    enabled: !!user?.id && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-6" />
          <div className="aspect-video bg-muted animate-pulse rounded-xl mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 bg-muted animate-pulse rounded w-3/4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <Music className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Item niet gevonden</h1>
          <p className="text-muted-foreground mb-6">Dit item bestaat niet of hoort niet bij jouw collectie.</p>
          <Button asChild>
            <Link to="/my-collection"><ArrowLeft className="w-4 h-4 mr-2" />Terug naar collectie</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = [
    item.front_image,
    item.catalog_image,
    item.back_image,
    item.matrix_image,
    item.barcode_image,
    item.additional_image,
  ].filter(Boolean) as string[];

  const displayImage = activeImage || images[0] || null;

  const details: { label: string; value: any; icon?: React.ReactNode }[] = [
    { label: "Artiest", value: item.artist, icon: <Music className="w-4 h-4" /> },
    { label: "Titel", value: item.title, icon: <Tag className="w-4 h-4" /> },
    { label: "Label", value: item.label, icon: <Layers className="w-4 h-4" /> },
    { label: "Catalogusnummer", value: item.catalog_number, icon: <Hash className="w-4 h-4" /> },
    { label: "Jaar", value: item.year, icon: <Calendar className="w-4 h-4" /> },
    { label: "Format", value: item.format },
    { label: "Genre", value: item.genre },
    { label: "Land", value: item.country, icon: <MapPin className="w-4 h-4" /> },
    { label: "Conditie", value: item.condition_grade !== "Not Graded" ? item.condition_grade : null },
    { label: "Barcode", value: item.barcode_number, icon: <Barcode className="w-4 h-4" /> },
    { label: "Matrix nummer", value: item.matrix_number },
    { label: "Kant", value: item.side },
    { label: "Stamper codes", value: item.stamper_codes },
    { label: "Stijl", value: item.style?.join(", ") },
    { label: "Discogs ID", value: item.discogs_id },
  ].filter(r => r.value != null && r.value !== "");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back nav */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden">
              {displayImage ? (
                <img src={displayImage} alt="Cover" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                      displayImage === img ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            {/* Title & badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {item.media_type === "cd" ? <><Disc className="w-3 h-3 mr-1" />CD</> : <><Disc3 className="w-3 h-3 mr-1" />Vinyl</>}
                </Badge>
                {item.is_public && <Badge variant="outline">Publiek</Badge>}
                {item.is_for_sale && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <ShoppingCart className="w-3 h-3 mr-1" />Te koop
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{item.title || "Onbekende titel"}</h1>
              <p className="text-lg text-muted-foreground">{item.artist || "Onbekende artiest"}</p>
            </div>

            {/* Pricing card */}
            {(item.calculated_advice_price || item.lowest_price || item.median_price || item.highest_price) && (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Euro className="w-4 h-4 text-primary" /> Prijsinformatie
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {item.calculated_advice_price != null && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block">Adviesprijs</span>
                      <span className="text-2xl font-bold text-primary">€{item.calculated_advice_price.toFixed(2)}</span>
                    </div>
                  )}
                  {item.lowest_price != null && (
                    <div>
                      <span className="text-muted-foreground text-xs block">Laagste</span>
                      <span className="font-medium">€{item.lowest_price.toFixed(2)}</span>
                    </div>
                  )}
                  {item.median_price != null && (
                    <div>
                      <span className="text-muted-foreground text-xs block">Mediaan</span>
                      <span className="font-medium">€{item.median_price.toFixed(2)}</span>
                    </div>
                  )}
                  {item.highest_price != null && (
                    <div>
                      <span className="text-muted-foreground text-xs block">Hoogste</span>
                      <span className="font-medium">€{item.highest_price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {item.marketplace_price != null && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground text-xs block">Verkoopprijs</span>
                    <span className="font-bold">€{item.marketplace_price.toFixed(2)}</span>
                  </div>
                )}
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {item.discogs_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={item.discogs_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Bekijk op Discogs
                  </a>
                </Button>
              )}
              {isConnected && item.discogs_id && item.discogs_id > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                  <Upload className="w-4 h-4 mr-1" />
                  Exporteer naar Discogs
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Full details table */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Alle details
          </h2>
          <div className="space-y-3">
            {details.map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                <span className="text-muted-foreground w-40 flex-shrink-0 flex items-center gap-1.5">
                  {row.icon}
                  {row.label}
                </span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Marketplace info */}
        {(item.shop_description || item.marketplace_comments || item.marketplace_sleeve_condition) && (
          <>
            <Separator className="my-8" />
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Marketplace informatie
              </h2>
              {item.marketplace_sleeve_condition && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Hoes conditie: </span>
                  <span className="font-medium">{item.marketplace_sleeve_condition}</span>
                </div>
              )}
              {item.shop_description && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs block mb-1">Beschrijving</span>
                  <p>{item.shop_description}</p>
                </div>
              )}
              {item.marketplace_comments && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs block mb-1">Opmerkingen</span>
                  <p>{item.marketplace_comments}</p>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Timestamps */}
        <div className="mt-8 text-xs text-muted-foreground flex gap-4">
          <span>Toegevoegd: {new Date(item.created_at).toLocaleDateString("nl-NL")}</span>
          {item.updated_at && (
            <span>Bijgewerkt: {new Date(item.updated_at).toLocaleDateString("nl-NL")}</span>
          )}
        </div>
      </div>

      {item.discogs_id && item.discogs_id > 0 && (
        <DiscogsExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          discogsIds={[item.discogs_id]}
          itemCount={1}
          defaultPrice={item.calculated_advice_price || item.marketplace_price || undefined}
        />
      )}
    </div>
  );
}
