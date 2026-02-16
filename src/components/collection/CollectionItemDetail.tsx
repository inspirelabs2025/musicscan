import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollectionItem } from "@/hooks/useMyCollection";
import { Disc, Disc3, Music, ExternalLink, TrendingUp, Euro, ShoppingCart, Upload, MapPin, Tag, Calendar, Hash, Barcode, Layers } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionItemDetailProps {
  item: CollectionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport?: (discogsId: number) => void;
}

export const CollectionItemDetail = ({ item, open, onOpenChange, onExport }: CollectionItemDetailProps) => {
  const { tr } = useLanguage();
  const s = tr.scannerUI;

  if (!item) return null;

  const images = [
    item.front_image,
    item.catalog_image,
    item.back_image,
    item.matrix_image,
    item.barcode_image,
    item.additional_image,
  ].filter(Boolean) as string[];

  const mainImage = images[0];

  const infoRows: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }[] = [
    { label: s.artist, value: item.artist, icon: <Music className="w-4 h-4" /> },
    { label: s.title, value: item.title, icon: <Tag className="w-4 h-4" /> },
    { label: s.label, value: item.label, icon: <Layers className="w-4 h-4" /> },
    { label: s.catalogNumber, value: item.catalog_number, icon: <Hash className="w-4 h-4" /> },
    { label: s.year, value: item.year, icon: <Calendar className="w-4 h-4" /> },
    { label: s.format, value: item.format },
    { label: s.genre, value: item.genre },
    { label: s.country, value: item.country, icon: <MapPin className="w-4 h-4" /> },
    { label: s.conditionLabel, value: item.condition_grade },
    { label: s.barcode, value: item.barcode_number, icon: <Barcode className="w-4 h-4" /> },
    { label: s.matrixNumberLabel, value: item.matrix_number },
    { label: s.side, value: item.side },
    { label: s.stamperCodes, value: item.stamper_codes },
    { label: s.style, value: item.style?.join(", ") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {item.media_type === "cd" ? <Disc className="w-5 h-5 text-primary" /> : <Disc3 className="w-5 h-5 text-primary" />}
            {item.artist ? `${item.artist} – ${item.title || s.unknown}` : item.title || s.unknownItem}
          </DialogTitle>
        </DialogHeader>

        {images.length > 0 && (
          <div className="space-y-2">
            {mainImage && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img src={mainImage} alt="Cover" className="w-full h-full object-contain" />
              </div>
            )}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 rounded-md object-cover border border-border flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {(item.calculated_advice_price || item.lowest_price || item.median_price || item.highest_price) && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Euro className="w-4 h-4 text-primary" /> {s.priceInfo}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {item.calculated_advice_price != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">{s.advicePrice}</span>
                  <span className="font-bold text-primary">€{item.calculated_advice_price.toFixed(2)}</span>
                </div>
              )}
              {item.lowest_price != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">{s.lowest}</span>
                  <span className="font-medium">€{item.lowest_price.toFixed(2)}</span>
                </div>
              )}
              {item.median_price != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">{s.median}</span>
                  <span className="font-medium">€{item.median_price.toFixed(2)}</span>
                </div>
              )}
              {item.highest_price != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">{s.highest}</span>
                  <span className="font-medium">€{item.highest_price.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          {infoRows
            .filter(r => r.value != null && r.value !== "" && r.value !== "Not Graded")
            .map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground w-36 flex-shrink-0 flex items-center gap-1.5">
                  {row.icon}
                  {row.label}
                </span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {item.media_type === "cd" ? "CD" : "Vinyl"}
          </Badge>
          {item.is_public && <Badge variant="outline">{s.publicBadge}</Badge>}
          {item.is_for_sale && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <ShoppingCart className="w-3 h-3 mr-1" />{s.forSale}
              {item.marketplace_price ? ` · €${item.marketplace_price.toFixed(2)}` : ""}
            </Badge>
          )}
          {item.marketplace_sleeve_condition && (
            <Badge variant="outline">{s.sleeve}: {item.marketplace_sleeve_condition}</Badge>
          )}
        </div>

        {item.shop_description && (
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block mb-1">{s.description}</span>
            <p>{item.shop_description}</p>
          </div>
        )}

        {item.marketplace_comments && (
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block mb-1">{s.comments}</span>
            <p>{item.marketplace_comments}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {item.discogs_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.discogs_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                {s.discogsPage}
              </a>
            </Button>
          )}
          {item.discogs_id && item.discogs_id > 0 && onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(item.discogs_id!)}>
              <Upload className="w-4 h-4 mr-1" />
              {s.exportToDiscogs}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
