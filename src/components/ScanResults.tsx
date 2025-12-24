
import React, { useMemo } from 'react';
import { ExternalLink, Copy, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScanResultsProps {
  analysisResult: any | null;
  searchResults: any[];
  searchStrategies: any[];
  mediaType: 'vinyl' | 'cd';
  onCopyToClipboard: (text: string) => void;
  onRetryPricing: () => void;
  isPricingRetrying: boolean;
  isPricingLoading: boolean;
}

export const ScanResults = React.memo(({ 
  analysisResult, 
  searchResults, 
  searchStrategies,
  mediaType,
  onCopyToClipboard,
  onRetryPricing,
  isPricingRetrying,
  isPricingLoading
}: ScanResultsProps) => {
  const getPriceBadgeColor = useMemo(() => (price: string | null) => {
    if (!price) return 'secondary';
    const numPrice = parseFloat(price.replace(',', '.'));
    if (numPrice < 20) return 'outline';
    if (numPrice < 50) return 'secondary';
    return 'destructive';
  }, []);

  const ocr = analysisResult?.analysis;
  const firstResult = searchResults[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* OCR Results - Only show if we have analysis data */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>OCR Scan Resultaten</CardTitle>
            <CardDescription>Geëxtraheerde informatie uit de foto's</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Artist', value: ocr?.artist },
                { label: 'Titel', value: ocr?.title },
                { label: 'Label', value: ocr?.label },
                { label: 'Catalogusnummer', value: ocr?.catalog_number },
                { label: 'Jaar', value: ocr?.year },
                { label: 'Genre', value: ocr?.genre },
                { label: 'Land', value: ocr?.country },
                ...(mediaType === 'vinyl' ? [{ label: 'Matrix nummer', value: ocr?.matrix_number }] : []),
                ...(mediaType === 'cd' ? [{ label: 'Barcode', value: ocr?.barcode }] : [])
              ].filter(item => item.value).map((item, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{item.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onCopyToClipboard(item.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discogs API Results - Show when no OCR data */}
      {!analysisResult && firstResult && (
        <Card>
          <CardHeader>
            <CardTitle>Discogs API Resultaten</CardTitle>
            <CardDescription>Informatie opgehaald via Discogs release ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Artist', value: firstResult.artist },
                { label: 'Titel', value: firstResult.title },
                { label: 'Label', value: firstResult.label },
                { label: 'Catalogusnummer', value: firstResult.catalog_number },
                { label: 'Jaar', value: firstResult.year },
                { label: 'Genre', value: firstResult.genre },
                { label: 'Land', value: firstResult.country },
                { label: 'Format', value: firstResult.format }
              ].filter(item => item.value).map((item, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{item.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onCopyToClipboard(item.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {firstResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Discogs Match</CardTitle>
              <CardDescription>Gevonden release informatie en prijzen</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryPricing}
              disabled={isPricingRetrying}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {isPricingRetrying ? 'Bezig...' : 'Prijzen Verversen'}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="pricing">Prijzen</TabsTrigger>
                <TabsTrigger value="search">Zoekstrategie</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="flex items-start gap-4">
                  {firstResult.cover_image && (
                    <img 
                      src={firstResult.cover_image} 
                      alt="Album cover" 
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{firstResult.title}</h3>
                    <p className="text-muted-foreground">{firstResult.artist}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{firstResult.year}</Badge>
                      <Badge variant="outline">{firstResult.format}</Badge>
                      <Badge variant="outline">{firstResult.label}</Badge>
                    </div>
                    {firstResult.discogs_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={firstResult.discogs_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Bekijk op Discogs
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                {firstResult.pricing_stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-4">
                      <TrendingUp className="h-4 w-4" />
                      Discogs Prijsinformatie
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Lowest Price Card */}
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-green-700 dark:text-green-400 mb-1">Laagste prijs</div>
                          <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                            €{firstResult.pricing_stats.lowest_price}
                          </div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.lowest_price)} className="mt-2">
                            Minimum
                          </Badge>
                        </CardContent>
                      </Card>

                      {/* Median Price Card */}
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Gemiddelde prijs</div>
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                            €{firstResult.pricing_stats.median_price}
                          </div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.median_price)} className="mt-2">
                            Gemiddeld
                          </Badge>
                        </CardContent>
                      </Card>

                      {/* Highest Price Card */}
                      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-red-700 dark:text-red-400 mb-1">Hoogste prijs</div>
                          <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                            €{firstResult.pricing_stats.highest_price}
                          </div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.highest_price)} className="mt-2">
                            Maximum
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : isPricingLoading ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p className="text-muted-foreground">Prijzen worden geladen...</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Even geduld, we halen de actuele prijzen op van Discogs</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Geen prijsinformatie beschikbaar</p>
                    <Button 
                      onClick={onRetryPricing} 
                      disabled={isPricingRetrying}
                      className="mt-4"
                    >
                      Probeer prijzen op te halen
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <div className="space-y-2">
                  {searchStrategies.length > 0 ? searchStrategies.map((strategy, index) => {
                    // Handle both object format and string format
                    const isObject = typeof strategy === 'object' && strategy !== null;
                    const strategyName = isObject ? strategy.strategy : String(strategy);
                    const success = isObject ? strategy.success : true;
                    const searchTerm = isObject ? strategy.search_term : '';
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{strategyName}</span>
                          <Badge variant={success ? "default" : "secondary"}>
                            {success ? "Succes" : "Gefaald"}
                          </Badge>
                        </div>
                        {searchTerm && (
                          <p className="text-sm text-muted-foreground mt-1">{searchTerm}</p>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="p-3 border rounded-lg">
                      <span className="font-medium">Direct Discogs ID</span>
                      <Badge variant="default" className="ml-2">Succes</Badge>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ScanResults.displayName = 'ScanResults';
