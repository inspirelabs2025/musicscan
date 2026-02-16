import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, ExternalLink, Music, Download } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CollectionItem } from "@/hooks/useMyCollection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReleaseByDiscogs } from "@/hooks/useReleaseByDiscogs";
import { useCreateOrFindRelease } from "@/hooks/useCreateOrFindRelease";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionItemCardProps {
  item: CollectionItem;
  onUpdate: (updates: Partial<CollectionItem>) => void;
  isUpdating?: boolean;
  showControls?: boolean;
}

export const CollectionItemCard = ({ 
  item, onUpdate, isUpdating = false, showControls = true
}: CollectionItemCardProps) => {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFetchingArtwork, setIsFetchingArtwork] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editValues, setEditValues] = useState({
    shop_description: item.shop_description || "",
    marketplace_price: item.marketplace_price || 0,
  });

  const { release: canonicalRelease } = useReleaseByDiscogs(item.discogs_id || 0);
  const createOrFindRelease = useCreateOrFindRelease();

  const handleSave = () => {
    onUpdate({
      shop_description: editValues.shop_description,
      marketplace_price: editValues.marketplace_price,
    });
    setIsEditing(false);
  };

  const getImageUrl = () => {
    if (item.media_type === 'cd') {
      return item.front_image || item.back_image || item.barcode_image || item.matrix_image;
    } else if (item.media_type === 'vinyl') {
      return item.catalog_image || item.matrix_image || item.additional_image;
    }
    return item.front_image || item.catalog_image;
  };

  const imageUrl = getImageUrl();

  const handleItemClick = async () => {
    if (canonicalRelease) { navigate(`/release/${canonicalRelease.id}`); return; }
    if (item.discogs_id) {
      try {
        const releaseId = await createOrFindRelease.mutateAsync({
          discogs_id: item.discogs_id, artist: item.artist || "", title: item.title || "",
          label: item.label, catalog_number: item.catalog_number, year: item.year,
          format: item.format, genre: item.genre, country: item.country,
          style: item.style, discogs_url: item.discogs_url,
        });
        navigate(`/release/${releaseId}`);
      } catch { navigate(`/album/${item.id}`); }
    } else { navigate(`/album/${item.id}`); }
  };

  const fetchOfficialArtwork = async () => {
    if (!item.discogs_url && (!item.artist || !item.title)) {
      toast({ title: sc.cannotSearchArtwork, description: sc.cannotSearchArtworkDesc, variant: "destructive" });
      return;
    }
    setIsFetchingArtwork(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-album-artwork', {
        body: { discogs_url: item.discogs_url, artist: item.artist, title: item.title, media_type: item.media_type, item_id: item.id }
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: sc.artworkFound, description: sc.artworkFoundDesc.replace('{source}', data.source) });
        window.location.reload();
      } else {
        toast({ title: sc.noArtworkFound, description: sc.noArtworkFoundDesc, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error fetching artwork:', error);
      toast({ title: sc.artworkError, description: sc.artworkErrorDesc, variant: "destructive" });
    } finally { setIsFetchingArtwork(false); }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/30 to-background/50 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleItemClick}>
        {imageUrl && !imageError ? (
          <img src={imageUrl} alt={`${item.artist} - ${item.title}`} className="w-full h-full object-cover" onError={() => setImageError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/10">
            <Music className="w-12 h-12 text-muted-foreground/50" />
            {showControls && (item.discogs_url || (item.artist && item.title)) && (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fetchOfficialArtwork(); }} disabled={isFetchingArtwork} className="text-xs">
                {isFetchingArtwork ? sc.searching : (<><Download className="h-3 w-3 mr-1" />{sc.searchArtwork}</>)}
              </Button>
            )}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs">{item.media_type.toUpperCase()}</Badge>
          {item.is_public && <Badge variant="outline" className="text-xs bg-primary/10">{sc.publicBadge}</Badge>}
          {item.is_for_sale && <Badge variant="default" className="text-xs">{sc.forSale}</Badge>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.artist || sc.unknownArtist}</h3>
          <p className="text-muted-foreground text-xs line-clamp-2">{item.title || sc.unknownTitle}</p>
          {item.label && <p className="text-muted-foreground text-xs">{item.label} {item.year && `(${item.year})`}</p>}
          {item.calculated_advice_price && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {sc.scannedValue}: €{item.calculated_advice_price}
              </Badge>
            </div>
          )}
        </div>

        {showControls && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`public-${item.id}`} className="text-xs">{sc.publicVisible}</Label>
                <Switch id={`public-${item.id}`} checked={item.is_public} onCheckedChange={(checked) => onUpdate({ is_public: checked })} disabled={isUpdating} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`sale-${item.id}`} className="text-xs">{sc.putForSale}</Label>
                <Switch id={`sale-${item.id}`} checked={item.is_for_sale} onCheckedChange={(checked) => onUpdate({ is_for_sale: checked })} disabled={isUpdating} />
              </div>
            </div>

            {item.is_for_sale && (
              <div className="border-t pt-3 space-y-2">
                {!isEditing ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.marketplace_price ? `${item.currency}${item.marketplace_price}` : sc.noPrice}</p>
                      {item.shop_description && <p className="text-xs text-muted-foreground line-clamp-2">{item.shop_description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Edit className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input type="number" placeholder={sc.price} value={editValues.marketplace_price} onChange={(e) => setEditValues(prev => ({ ...prev, marketplace_price: parseFloat(e.target.value) || 0 }))} className="text-xs" />
                    <Textarea placeholder={sc.shopDescription} value={editValues.shop_description} onChange={(e) => setEditValues(prev => ({ ...prev, shop_description: e.target.value }))} className="text-xs min-h-[60px]" />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSave} disabled={isUpdating} className="flex-1 text-xs">{sc.save}</Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-xs">{sc.cancel}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!showControls && item.marketplace_price && (
          <div className="border-t pt-3">
            <p className="text-lg font-semibold text-primary">{item.currency}{item.marketplace_price}</p>
            {item.shop_description && <p className="text-sm text-muted-foreground mt-1">{item.shop_description}</p>}
          </div>
        )}

        {item.discogs_url && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.open(item.discogs_url!, '_blank')}>
            <ExternalLink className="w-3 h-3 mr-1" />Discogs
          </Button>
        )}
      </div>
    </Card>
  );
};
