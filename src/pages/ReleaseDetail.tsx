import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Users, Calendar, Eye } from "lucide-react";
import { useReleaseDetail } from "@/hooks/useReleaseDetail";
import { useAlbumInsights } from "@/hooks/useAlbumInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageGallery } from "@/components/ImageGallery";
import { PriceAnalysisSection } from "@/components/PriceAnalysisSection";
import { TechnicalSpecsSection } from "@/components/TechnicalSpecsSection";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export default function ReleaseDetail() {
  const { releaseId } = useParams<{ releaseId: string }>();
  const { release, scans, isLoading, error } = useReleaseDetail(releaseId!);
  const { insights, isLoading: isLoadingInsights, generateInsights } = useAlbumInsights();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 mb-6" />
              <Skeleton className="h-48" />
            </div>
            <div>
              <Skeleton className="h-64 mb-4" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/my-collection" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Terug naar collectie
          </Link>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Release niet gevonden</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Collect all images from scans
  const allImages = scans.flatMap(scan => {
    const images = [];
    if (scan.front_image) images.push({ url: scan.front_image, label: "Front Cover", type: "front" });
    if (scan.back_image) images.push({ url: scan.back_image, label: "Back Cover", type: "back" });
    if (scan.barcode_image) images.push({ url: scan.barcode_image, label: "Barcode", type: "barcode" });
    if (scan.matrix_image) images.push({ url: scan.matrix_image, label: "Matrix/Runout", type: "matrix" });
    if (scan.catalog_image) images.push({ url: scan.catalog_image, label: "Catalog", type: "catalog" });
    if (scan.additional_image) images.push({ url: scan.additional_image, label: "Additional", type: "additional" });
    return images;
  });

  // Calculate price range from scans
  const prices = scans
    .map(scan => scan.calculated_advice_price)
    .filter((price): price is number => price !== null && price !== undefined);
  
  const priceRange = prices.length > 0 ? {
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] || 0
  } : null;

  // Get marketplace prices
  const marketplacePrices = scans
    .filter(scan => scan.is_for_sale && scan.marketplace_price)
    .map(scan => scan.marketplace_price!)
    .filter(price => price > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/my-collection" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar collectie
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <ImageGallery images={allImages} />
                </CardContent>
              </Card>
            )}

            {/* Release Information */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">{release.title}</CardTitle>
                    <p className="text-xl text-muted-foreground mb-4">{release.artist}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {release.total_scans} exemplar{release.total_scans !== 1 ? 'en' : ''}
                      </Badge>
                      {release.year && (
                        <Badge variant="outline">{release.year}</Badge>
                      )}
                      {release.format && (
                        <Badge variant="outline">{release.format}</Badge>
                      )}
                      {scans.some(scan => scan.is_for_sale) && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Te koop
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {release.label && (
                    <div>
                      <span className="font-medium">Label:</span>
                      <p className="text-muted-foreground">{release.label}</p>
                    </div>
                  )}
                  {release.catalog_number && (
                    <div>
                      <span className="font-medium">Catalog nummer:</span>
                      <p className="text-muted-foreground">{release.catalog_number}</p>
                    </div>
                  )}
                  {release.genre && (
                    <div>
                      <span className="font-medium">Genre:</span>
                      <p className="text-muted-foreground">{release.genre}</p>
                    </div>
                  )}
                  {release.country && (
                    <div>
                      <span className="font-medium">Land:</span>
                      <p className="text-muted-foreground">{release.country}</p>
                    </div>
                  )}
                  {release.discogs_id && (
                    <div>
                      <span className="font-medium">Discogs ID:</span>
                      <p className="text-muted-foreground">{release.discogs_id}</p>
                    </div>
                  )}
                </div>

                {release.style && release.style.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium mb-2 block">Stijlen:</span>
                    <div className="flex flex-wrap gap-1">
                      {release.style.map((style, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Eerste scan: {formatDistanceToNow(new Date(release.first_scan_date || release.created_at), { 
                      addSuffix: true, 
                      locale: nl 
                    })}
                  </div>
                  {release.last_scan_date && release.last_scan_date !== release.first_scan_date && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Laatste scan: {formatDistanceToNow(new Date(release.last_scan_date), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </div>
                  )}
                </div>

                {release.discogs_url && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" asChild>
                      <a href={release.discogs_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bekijk op Discogs
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            {insights ? (
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Historische Context</h4>
                    <p className="text-sm text-muted-foreground">{insights.historical_context}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Artistieke Betekenis</h4>
                    <p className="text-sm text-muted-foreground">{insights.artistic_significance}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Culturele Impact</h4>
                    <p className="text-sm text-muted-foreground">{insights.cultural_impact}</p>
                  </div>
                  {insights.fun_facts && insights.fun_facts.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Leuke Weetjes</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {insights.fun_facts.map((fact, index) => (
                          <li key={index}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Button 
                    onClick={() => generateInsights(release.id)}
                    disabled={isLoadingInsights}
                    variant="outline"
                  >
                    {isLoadingInsights ? "Genereren..." : "Genereer AI Insights"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Analysis */}
            {priceRange && (
              <PriceAnalysisSection
                lowestPrice={priceRange.min}
                medianPrice={priceRange.median}
                highestPrice={priceRange.max}
                calculatedAdvicePrice={priceRange.median}
                marketplacePrice={marketplacePrices.length > 0 ? Math.min(...marketplacePrices) : undefined}
                currency="€"
              />
            )}

            {/* Available Copies */}
            <Card>
              <CardHeader>
                <CardTitle>Beschikbare Exemplaren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scans.filter(scan => scan.is_for_sale).map((scan) => (
                    <div key={scan.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{scan.media_type.toUpperCase()}</Badge>
                        {scan.marketplace_price && (
                          <span className="font-semibold">€{scan.marketplace_price}</span>
                        )}
                      </div>
                      {scan.condition_grade && (
                        <p className="text-sm text-muted-foreground">
                          Conditie: {scan.condition_grade}
                        </p>
                      )}
                      {scan.shop_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {scan.shop_description}
                        </p>
                      )}
                      {scan.marketplace_location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {scan.marketplace_location}
                        </p>
                      )}
                    </div>
                  ))}
                  {scans.filter(scan => scan.is_for_sale).length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Geen exemplaren te koop
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Specs from first scan */}
            {scans.length > 0 && (
              <TechnicalSpecsSection
                format={release.format}
                marketplaceWeight={scans[0].marketplace_weight}
                marketplaceFormatQuantity={1}
                marketplaceLocation={scans[0].marketplace_location}
                marketplaceAllowOffers={scans[0].marketplace_allow_offers}
                marketplaceStatus="Active"
                barcode={scans[0].barcode_number}
                matrixNumber={scans[0].matrix_number}
                side={scans[0].side}
                stamperCodes={scans[0].stamper_codes}
                style={release.style}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}