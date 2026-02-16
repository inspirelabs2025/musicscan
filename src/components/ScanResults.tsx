
import React, { useMemo } from 'react';
import { ExternalLink, Copy, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

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
  analysisResult, searchResults, searchStrategies, mediaType,
  onCopyToClipboard, onRetryPricing, isPricingRetrying, isPricingLoading
}: ScanResultsProps) => {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;

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
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>{sc.ocrResults}</CardTitle>
            <CardDescription>{sc.ocrDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: sc.artist, value: ocr?.artist },
                { label: sc.titel, value: ocr?.title },
                { label: sc.label, value: ocr?.label },
                { label: sc.catalogNumber, value: ocr?.catalog_number },
                { label: sc.year, value: ocr?.year },
                { label: sc.genre, value: ocr?.genre },
                { label: sc.country, value: ocr?.country },
                ...(mediaType === 'vinyl' ? [{ label: sc.matrixNumber, value: ocr?.matrix_number }] : []),
                ...(mediaType === 'cd' ? [{ label: sc.barcode, value: ocr?.barcode }] : [])
              ].filter(item => item.value).map((item, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{item.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.value}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopyToClipboard(item.value)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!analysisResult && firstResult && (
        <Card>
          <CardHeader>
            <CardTitle>{sc.discogsApiResults}</CardTitle>
            <CardDescription>{sc.discogsApiDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: sc.artist, value: firstResult.artist },
                { label: sc.titel, value: firstResult.title },
                { label: sc.label, value: firstResult.label },
                { label: sc.catalogNumber, value: firstResult.catalog_number },
                { label: sc.year, value: firstResult.year },
                { label: sc.genre, value: firstResult.genre },
                { label: sc.country, value: firstResult.country },
                { label: sc.format, value: firstResult.format }
              ].filter(item => item.value).map((item, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{item.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.value}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopyToClipboard(item.value)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {firstResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{sc.discogsMatch}</CardTitle>
              <CardDescription>{sc.discogsMatchDesc}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRetryPricing} disabled={isPricingRetrying} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isPricingRetrying ? sc.refreshing : sc.refreshPrices}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">{sc.details}</TabsTrigger>
                <TabsTrigger value="pricing">{sc.pricing}</TabsTrigger>
                <TabsTrigger value="search">{sc.searchStrategy}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="flex items-start gap-4">
                  {firstResult.cover_image && (
                    <img src={firstResult.cover_image} alt="Album cover" className="w-24 h-24 object-cover rounded-md border" />
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
                          {sc.viewOnDiscogs}
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
                      {sc.discogsPriceInfo}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-green-700 dark:text-green-400 mb-1">{sc.lowestPrice}</div>
                          <div className="text-2xl font-bold text-green-800 dark:text-green-300">€{firstResult.pricing_stats.lowest_price}</div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.lowest_price)} className="mt-2">{sc.minimum}</Badge>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">{sc.medianPrice}</div>
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">€{firstResult.pricing_stats.median_price}</div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.median_price)} className="mt-2">{sc.average}</Badge>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-red-700 dark:text-red-400 mb-1">{sc.highestPrice}</div>
                          <div className="text-2xl font-bold text-red-800 dark:text-red-300">€{firstResult.pricing_stats.highest_price}</div>
                          <Badge variant={getPriceBadgeColor(firstResult.pricing_stats.highest_price)} className="mt-2">{sc.maximum}</Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : isPricingLoading ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p className="text-muted-foreground">{sc.pricesLoading}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{sc.pricesLoadingDesc}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{sc.noPriceInfo}</p>
                    <Button onClick={onRetryPricing} disabled={isPricingRetrying} className="mt-4">{sc.tryFetchPrices}</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <div className="space-y-2">
                  {searchStrategies.length > 0 ? searchStrategies.map((strategy, index) => {
                    const isObject = typeof strategy === 'object' && strategy !== null;
                    const strategyName = isObject ? strategy.strategy : String(strategy);
                    const success = isObject ? strategy.success : true;
                    const searchTerm = isObject ? strategy.search_term : '';
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{strategyName}</span>
                          <Badge variant={success ? "default" : "secondary"}>{success ? sc.success : sc.failed}</Badge>
                        </div>
                        {searchTerm && <p className="text-sm text-muted-foreground mt-1">{searchTerm}</p>}
                      </div>
                    );
                  }) : (
                    <div className="p-3 border rounded-lg">
                      <span className="font-medium">{sc.directDiscogsId}</span>
                      <Badge variant="default" className="ml-2">{sc.success}</Badge>
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
