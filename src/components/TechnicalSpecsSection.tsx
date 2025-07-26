import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Package, MapPin, ShoppingCart } from "lucide-react";

interface TechnicalSpecsSectionProps {
  format?: string;
  marketplaceWeight?: number;
  marketplaceFormatQuantity?: number;
  marketplaceLocation?: string;
  marketplaceAllowOffers?: boolean;
  marketplaceStatus?: string;
  barcode?: string;
  matrixNumber?: string;
  side?: string;
  stamperCodes?: string;
  style?: string[];
  marketplaceSleeve?: string;
}

export function TechnicalSpecsSection({
  format,
  marketplaceWeight,
  marketplaceFormatQuantity,
  marketplaceLocation,
  marketplaceAllowOffers,
  marketplaceStatus,
  barcode,
  matrixNumber,
  side,
  stamperCodes,
  style,
  marketplaceSleeve
}: TechnicalSpecsSectionProps) {
  const hasMarketplaceData = marketplaceWeight || marketplaceFormatQuantity || marketplaceLocation || marketplaceStatus;
  const hasTechnicalData = barcode || matrixNumber || side || stamperCodes || style?.length;
  
  // Don't render if no data available
  if (!hasMarketplaceData && !hasTechnicalData && !format) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Technische Specificaties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format & Physical Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            Fysieke Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {format && (
              <div>
                <span className="text-muted-foreground">Format:</span>
                <div className="font-medium">{format}</div>
              </div>
            )}
            {marketplaceWeight && (
              <div>
                <span className="text-muted-foreground">Gewicht:</span>
                <div className="font-medium">{marketplaceWeight}g</div>
              </div>
            )}
            {marketplaceFormatQuantity && (
              <div>
                <span className="text-muted-foreground">Aantal:</span>
                <div className="font-medium">{marketplaceFormatQuantity}x</div>
              </div>
            )}
            {marketplaceSleeve && (
              <div>
                <span className="text-muted-foreground">Hoes Conditie:</span>
                <div className="font-medium">{marketplaceSleeve}</div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Identifiers */}
        {hasTechnicalData && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Technische Identifiers</h4>
              <div className="space-y-2 text-sm">
                {barcode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Barcode:</span>
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{barcode}</code>
                  </div>
                )}
                {matrixNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matrix:</span>
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{matrixNumber}</code>
                  </div>
                )}
                {side && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kant:</span>
                    <span className="font-medium">{side}</span>
                  </div>
                )}
                {stamperCodes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stamper:</span>
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{stamperCodes}</code>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Style Tags */}
        {style && style.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Stijlen</h4>
              <div className="flex flex-wrap gap-2">
                {style.map((styleItem, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {styleItem}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Marketplace Information */}
        {hasMarketplaceData && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Marketplace Informatie
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {marketplaceLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Locatie:</span>
                    <span className="font-medium">{marketplaceLocation}</span>
                  </div>
                )}
                {marketplaceStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{marketplaceStatus}</Badge>
                  </div>
                )}
                {marketplaceAllowOffers !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Biedingen:</span>
                    <Badge variant={marketplaceAllowOffers ? "default" : "secondary"}>
                      {marketplaceAllowOffers ? "Toegestaan" : "Niet toegestaan"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}