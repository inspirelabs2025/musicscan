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

interface CollectionItemCardProps {
  item: CollectionItem;
  onUpdate: (updates: Partial<CollectionItem>) => void;
  isUpdating?: boolean;
  showControls?: boolean;
}

export const CollectionItemCard = ({ 
  item, 
  onUpdate, 
  isUpdating = false,
  showControls = true
}: CollectionItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFetchingArtwork, setIsFetchingArtwork] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editValues, setEditValues] = useState({
    shop_description: item.shop_description || "",
    marketplace_price: item.marketplace_price || 0,
  });

  // Check if canonical release exists
  const { release: canonicalRelease } = useReleaseByDiscogs(item.discogs_id || 0);
  const createOrFindRelease = useCreateOrFindRelease();

  const handleSave = () => {
    onUpdate({
      shop_description: editValues.shop_description,
      marketplace_price: editValues.marketplace_price,
    });
    setIsEditing(false);
  };

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

  const handleItemClick = async () => {
    // If canonical release exists, navigate to it
    if (canonicalRelease) {
      navigate(`/release/${canonicalRelease.id}`);
      return;
    }

    // If discogs_id exists but no canonical release, create one
    if (item.discogs_id) {
      try {
        const releaseId = await createOrFindRelease.mutateAsync({
          discogs_id: item.discogs_id,
          artist: item.artist || "",
          title: item.title || "",
          label: item.label,
          catalog_number: item.catalog_number,
          year: item.year,
          format: item.format,
          genre: item.genre,
          country: item.country,
          style: item.style,
          discogs_url: item.discogs_url,
        });
        navigate(`/release/${releaseId}`);
      } catch (error) {
        // Fallback to individual album page
        navigate(`/album/${item.id}`);
      }
    } else {
      // No discogs_id, go to individual album page
      navigate(`/album/${item.id}`);
    }
  };

  const fetchOfficialArtwork = async () => {
    if (!item.discogs_url && (!item.artist || !item.title)) {
      toast({
        title: "Kan geen artwork zoeken",
        description: "Geen Discogs URL of artiest/titel informatie beschikbaar.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingArtwork(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-album-artwork', {
        body: {
          discogs_url: item.discogs_url,
          artist: item.artist,
          title: item.title,
          media_type: item.media_type,
          item_id: item.id,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Artwork gevonden!",
          description: `Officiële artwork opgehaald van ${data.source}`,
        });
        // Refresh the page to show new artwork
        window.location.reload();
      } else {
        toast({
          title: "Geen artwork gevonden",
          description: "Er kon geen officiële artwork gevonden worden voor dit album.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching artwork:', error);
      toast({
        title: "Fout bij ophalen artwork",
        description: "Er is een fout opgetreden bij het zoeken naar artwork.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingArtwork(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
      <div 
        className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/30 to-background/50 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleItemClick}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${item.artist} - ${item.title}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/10">
            <Music className="w-12 h-12 text-muted-foreground/50" />
            {showControls && (item.discogs_url || (item.artist && item.title)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchOfficialArtwork();
                }}
                disabled={isFetchingArtwork}
                className="text-xs"
              >
                {isFetchingArtwork ? (
                  "Zoeken..."
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    Artwork zoeken
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-xs">
            {item.media_type.toUpperCase()}
          </Badge>
          {item.is_public && (
            <Badge variant="outline" className="text-xs bg-primary/10">
              Publiek
            </Badge>
          )}
          {item.is_for_sale && (
            <Badge variant="default" className="text-xs">
              Te koop
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {item.artist || "Onbekende artiest"}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2">
            {item.title || "Onbekende titel"}
          </p>
          {item.label && (
            <p className="text-muted-foreground text-xs">
              {item.label} {item.year && `(${item.year})`}
            </p>
          )}
        </div>

        {showControls && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`public-${item.id}`} className="text-xs">
                  Publiek zichtbaar
                </Label>
                <Switch
                  id={`public-${item.id}`}
                  checked={item.is_public}
                  onCheckedChange={(checked) => onUpdate({ is_public: checked })}
                  disabled={isUpdating}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor={`sale-${item.id}`} className="text-xs">
                  Te koop zetten
                </Label>
                <Switch
                  id={`sale-${item.id}`}
                  checked={item.is_for_sale}
                  onCheckedChange={(checked) => onUpdate({ is_for_sale: checked })}
                  disabled={isUpdating}
                />
              </div>
            </div>

            {item.is_for_sale && (
              <div className="border-t pt-3 space-y-2">
                {!isEditing ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {item.marketplace_price ? `${item.currency}${item.marketplace_price}` : "Geen prijs"}
                      </p>
                      {item.shop_description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.shop_description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Prijs"
                      value={editValues.marketplace_price}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        marketplace_price: parseFloat(e.target.value) || 0
                      }))}
                      className="text-xs"
                    />
                    <Textarea
                      placeholder="Beschrijving voor winkel..."
                      value={editValues.shop_description}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        shop_description: e.target.value
                      }))}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="flex-1 text-xs"
                      >
                        Opslaan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-xs"
                      >
                        Annuleren
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!showControls && item.marketplace_price && (
          <div className="border-t pt-3">
            <p className="text-lg font-semibold text-primary">
              {item.currency}{item.marketplace_price}
            </p>
            {item.shop_description && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.shop_description}
              </p>
            )}
          </div>
        )}

        {item.discogs_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.open(item.discogs_url!, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Discogs
          </Button>
        )}
      </div>
    </Card>
  );
};