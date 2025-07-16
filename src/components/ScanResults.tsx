import React, { useMemo } from 'react';
import { ExternalLink, Copy, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScanResultsProps {
  analysisResult: any;
  searchResults: any[];
  searchStrategies: any[];
  mediaType: 'vinyl' | 'cd';
  onCopyToClipboard: (text: string) => void;
  onRetryPricing: () => void;
  isPricingRetrying: boolean;
}

export const ScanResults = React.memo(({ 
  analysisResult, 
  searchResults, 
  searchStrategies,
  mediaType,
  onCopyToClipboard,
  onRetryPricing,
  isPricingRetrying
}: ScanResultsProps) => {
  const getPriceBadge = useMemo(() => (price: string | null) => {
    if (!price) return null;
    const numPrice = parseFloat(price.replace(',', '.'));
    if (numPrice < 20) return <Badge variant="secondary" className="bg-success/10 text-success">Laag</Badge>;
    if (numPrice < 50) return <Badge variant="secondary" className="bg-warning/10 text-warning">Gemiddeld</Badge>;
    return <Badge variant="secondary" className="bg-destructive/10 text-destructive">Hoog</Badge>;
  }, []);

  const ocr = analysisResult?.analysis;
  const firstResult = searchResults[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* OCR Results */}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Laagste prijs</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">€{firstResult.pricing_stats.lowest_price}</span>
                        {getPriceBadge(firstResult.pricing_stats.lowest_price)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gemiddelde prijs</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">€{firstResult.pricing_stats.median_price}</span>
                        {getPriceBadge(firstResult.pricing_stats.median_price)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hoogste prijs</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">€{firstResult.pricing_stats.highest_price}</span>
                        {getPriceBadge(firstResult.pricing_stats.highest_price)}
                      </div>
                    </div>
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
                  {searchStrategies.map((strategy, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{strategy.strategy}</span>
                        <Badge variant={strategy.success ? "default" : "secondary"}>
                          {strategy.success ? "Succes" : "Gefaald"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{strategy.search_term}</p>
                    </div>
                  ))}
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