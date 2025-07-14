import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Disc3, Search, ExternalLink, Copy, CheckCircle, AlertCircle, RefreshCcw, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/FileUpload';
import { useVinylAnalysis } from '@/hooks/useVinylAnalysis';
import { useCDAnalysis } from '@/hooks/useCDAnalysis';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const VinylScanComplete = () => {
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [calculatedAdvicePrice, setCalculatedAdvicePrice] = useState<number | null>(null);
  const [isSavingCondition, setIsSavingCondition] = useState(false);
  
  const { 
    isAnalyzing: isAnalyzingVinyl, 
    analysisResult: vinylAnalysisResult, 
    analyzeImages: analyzeVinylImages,
    setAnalysisResult: setVinylAnalysisResult 
  } = useVinylAnalysis();

  const { 
    isAnalyzing: isAnalyzingCD, 
    analysisResult: cdAnalysisResult, 
    analyzeImages: analyzeCDImages,
    setAnalysisResult: setCDAnalysisResult 
  } = useCDAnalysis();

  // Use the appropriate analysis based on media type
  const isAnalyzing = mediaType === 'vinyl' ? isAnalyzingVinyl : (mediaType === 'cd' ? isAnalyzingCD : false);
  const analysisResult = mediaType === 'vinyl' ? vinylAnalysisResult : (mediaType === 'cd' ? cdAnalysisResult : null);
  const analyzeImages = mediaType === 'vinyl' ? analyzeVinylImages : (mediaType === 'cd' ? analyzeCDImages : null);
  const setAnalysisResult = mediaType === 'vinyl' ? setVinylAnalysisResult : (mediaType === 'cd' ? setCDAnalysisResult : null);

  const {
    isSearching,
    searchResults,
    searchStrategies,
    searchCatalog,
    retryPricing,
    isPricingRetrying
  } = useDiscogsSearch();

  // Auto-trigger analysis when photos are uploaded
  useEffect(() => {
    if (!mediaType || !analyzeImages) return;
    const requiredPhotos = mediaType === 'vinyl' ? 3 : 3; // CD's need 3 photos too (front, back, barcode)
    if (uploadedFiles.length >= requiredPhotos && !isAnalyzing && !analysisResult) {
      setCurrentStep(2);
      analyzeImages(uploadedFiles);
    }
  }, [uploadedFiles, isAnalyzing, analysisResult, analyzeImages, mediaType]);

  // Auto-trigger Discogs search when OCR analysis completes with catalog number
  useEffect(() => {
    if (analysisResult?.ocrResults?.catalog_number && !isSearching && searchResults.length === 0) {
      setCurrentStep(3);
      const { artist, title, catalog_number } = analysisResult.ocrResults;
      searchCatalog(catalog_number, artist, title);
    }
  }, [analysisResult, isSearching, searchResults.length, searchCatalog]);

  // Update step when search completes
  useEffect(() => {
    if (searchResults.length > 0) {
      setCurrentStep(4);
    }
  }, [searchResults]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: "Tekst is gekopieerd naar klembord",
      variant: "default"
    });
  };

  const getPriceBadge = (price: string | null) => {
    if (!price) return null;
    const numPrice = parseFloat(price.replace(',', '.'));
    if (numPrice < 20) return <Badge variant="secondary" className="bg-green-100 text-green-800">Laag</Badge>;
    if (numPrice < 50) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Gemiddeld</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Hoog</Badge>;
  };

  const getProgress = () => {
    if (currentStep === 1) return 0;
    if (currentStep === 2) return 33;
    if (currentStep === 3) return 66;
    return 100;
  };

  // Condition multipliers based on lowest price
  const vinylConditionMultipliers: Record<string, number> = {
    'Mint (M)': 2.0,
    'Near Mint (NM or M-)': 1.8,
    'Very Good Plus (VG+)': 1.5,
    'Very Good (VG)': 1.2,
    'Good Plus (G+)': 1.0,
    'Good (G)': 0.8,
    'Fair (F) / Poor (P)': 0.6
  };

  const cdConditionMultipliers: Record<string, number> = {
    'Mint (M)': 1.8,
    'Near Mint (NM)': 1.6,
    'Very Good Plus (VG+)': 1.3,
    'Very Good (VG)': 1.0,
    'Good Plus (G+)': 0.8,
    'Good (G)': 0.6,
    'Fair (F) / Poor (P)': 0.4
  };

  const conditionMultipliers = mediaType === 'vinyl' ? vinylConditionMultipliers : (mediaType === 'cd' ? cdConditionMultipliers : {});

  // Calculate advice price based on condition and lowest price
  const calculateAdvicePrice = (condition: string, lowestPrice: string | null) => {
    if (!condition || !lowestPrice) return null;
    let price = parseFloat(lowestPrice.replace(',', '.'));
    
    // Minimum price rule: if lowest price is under €1.00, use €1.00 as base
    if (price < 1.00) {
      price = 1.00;
    }
    
    const multiplier = conditionMultipliers[condition];
    return Math.round(price * multiplier * 100) / 100; // Round to 2 decimals
  };

  // Update database with condition and calculated price
  const updateScanWithCondition = async (condition: string, advicePrice: number) => {
    if (!analysisResult?.scanId) return;

    setIsSavingCondition(true);
    try {
      const tableName = mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      const { error } = await supabase
        .from(tableName)
        .update({
          condition_grade: condition,
          calculated_advice_price: advicePrice
        })
        .eq('id', analysisResult.scanId);

      if (error) throw error;

      toast({
        title: "Conditie Opgeslagen! ✅",
        description: `Adviesprijs: €${advicePrice.toFixed(2)}`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error updating ${mediaType} scan:`, error);
      toast({
        title: "Fout bij Opslaan",
        description: "Kon conditie niet opslaan in database",
        variant: "destructive"
      });
    } finally {
      setIsSavingCondition(false);
    }
  };

  // Handle condition selection
  const handleConditionChange = (condition: string) => {
    setSelectedCondition(condition);
    
    const lowestPrice = searchResults[0]?.pricing_stats?.lowest_price;
    if (lowestPrice) {
      const advicePrice = calculateAdvicePrice(condition, lowestPrice);
      if (advicePrice) {
        setCalculatedAdvicePrice(advicePrice);
        updateScanWithCondition(condition, advicePrice);
      }
    }
  };

  const resetScan = () => {
    setCurrentStep(1);
    setUploadedFiles([]);
    setVinylAnalysisResult(null);
    setCDAnalysisResult(null);
    setSelectedCondition('');
    setCalculatedAdvicePrice(null);
    // Reset media type to enforce selection
    setMediaType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Scan Complete</h1>
              <p className="text-gray-600">Upload → OCR → Discogs → Resultaten</p>
            </div>
          </div>
          {(analysisResult || searchResults.length > 0 || uploadedFiles.length > 0) && (
            <Button 
              onClick={resetScan} 
              variant="outline" 
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Media Type Selection */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Disc3 className="h-5 w-5" />
              Kies Media Type (Verplicht)
            </CardTitle>
            <CardDescription>
              Selecteer eerst het type media voordat je kunt uploaden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mediaType || ''} onValueChange={(value) => setMediaType(value as 'vinyl' | 'cd')}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger 
                  value="vinyl" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-purple-50"
                >
                  🎵 Vinyl / LP
                </TabsTrigger>
                <TabsTrigger 
                  value="cd"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white hover:bg-blue-50"
                >
                  💿 CD
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {!mediaType && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Selecteer eerst een media type om door te gaan</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto Upload ({uploadedFiles.length}/3)
                </CardTitle>
                <CardDescription>
                  {mediaType === 'vinyl' 
                    ? 'Upload 3 foto\'s: voorkant, achterkant, en label'
                    : 'Upload 3 foto\'s: voorkant, achterkant, en barcode'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!mediaType ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-amber-800 font-medium">Selecteer eerst een media type (LP of CD) om te uploaden</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[0, 1, 2].map((index) => (
                      <FileUpload 
                        key={index}
                        step={index + 1}
                        stepTitle={`Foto ${index + 1}`}
                        stepDescription={
                          mediaType === 'vinyl' ? (
                            index === 0 ? "Upload voorkant van de LP" :
                            index === 1 ? "Upload achterkant van de LP" :
                            "Upload label of matrix/catalog foto"
                          ) : (
                            index === 0 ? "Upload voorkant van de CD" :
                            index === 1 ? "Upload achterkant van de CD" :
                            "Upload barcode van de CD"
                          )
                        }
                        isCompleted={uploadedFiles[index] !== undefined}
                        onFileUploaded={(url) => {
                          setUploadedFiles(prev => [...prev.slice(0, index), url, ...prev.slice(index + 1)]);
                        }}
                      />
                    ))}
                  </div>
                )}
                {uploadedFiles.length === 3 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Alle foto's geüpload! OCR analyse gestart...
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reset Button */}
            {(analysisResult || searchResults.length > 0) && (
              <Button onClick={resetScan} variant="outline" className="w-full">
                Nieuwe Scan Starten
              </Button>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Loading States */}
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>OCR analyse bezig...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {isSearching && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Discogs zoeken...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {(analysisResult || searchResults.length > 0) && (
              <Tabs defaultValue="combined" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="combined">Gecombineerd</TabsTrigger>
                  <TabsTrigger value="ocr">OCR</TabsTrigger>
                  <TabsTrigger value="discogs">Discogs</TabsTrigger>
                </TabsList>

                {/* Combined Results */}
                <TabsContent value="combined" className="space-y-4">
                  {analysisResult?.ocrResults && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Disc3 className="h-5 w-5" />
                          OCR Resultaten
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Artiest:</strong> {analysisResult.ocrResults.artist || 'Onbekend'}</div>
                        <div><strong>Titel:</strong> {analysisResult.ocrResults.title || 'Onbekend'}</div>
                        <div><strong>Catalogusnummer:</strong> {analysisResult.ocrResults.catalog_number || 'Niet gevonden'}</div>
                        <div><strong>Label:</strong> {analysisResult.ocrResults.label || 'Onbekend'}</div>
                        {analysisResult.ocrResults.year && (
                          <div><strong>Jaar:</strong> {analysisResult.ocrResults.year}</div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {searchResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Beste Discogs Match
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {searchResults[0] && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><strong>Artiest:</strong> {searchResults[0].artist}</div>
                              <div><strong>Titel:</strong> {searchResults[0].title}</div>
                              <div><strong>Label:</strong> {searchResults[0].label}</div>
                              <div><strong>Jaar:</strong> {searchResults[0].year}</div>
                              <div><strong>Formaat:</strong> {searchResults[0].format}</div>
                              <div><strong>Land:</strong> {searchResults[0].country}</div>
                            </div>

                             {searchResults[0].pricing_stats && (
                               <div>
                                 <div className="flex items-center justify-between mb-2">
                                   <h4 className="font-medium">Prijsinformatie:</h4>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => retryPricing(searchResults[0].id)}
                                     disabled={isPricingRetrying}
                                     className="h-8"
                                   >
                                     {isPricingRetrying ? (
                                       <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                     ) : (
                                       <RefreshCcw className="h-3 w-3 mr-1" />
                                     )}
                                     Update Prijzen
                                   </Button>
                                 </div>
                                 <div className="flex gap-2">
                                   {searchResults[0].pricing_stats.lowest_price && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-sm">Laagste: €{searchResults[0].pricing_stats.lowest_price}</span>
                                       {getPriceBadge(searchResults[0].pricing_stats.lowest_price)}
                                     </div>
                                   )}
                                   {searchResults[0].pricing_stats.median_price && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-sm">Mediaan: €{searchResults[0].pricing_stats.median_price}</span>
                                       {getPriceBadge(searchResults[0].pricing_stats.median_price)}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}

                             {/* No pricing warning + retry button */}
                             {searchResults[0] && !searchResults[0].pricing_stats?.lowest_price && (
                               <Alert className="border-yellow-200 bg-yellow-50">
                                 <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                 <AlertDescription className="text-yellow-800">
                                   <div className="flex items-center justify-between">
                                     <span>Geen prijsinformatie beschikbaar</span>
                                     <Button 
                                       size="sm" 
                                       variant="outline"
                                       onClick={() => retryPricing(searchResults[0].id)}
                                       disabled={isPricingRetrying}
                                       className="ml-2 h-8"
                                     >
                                       {isPricingRetrying ? (
                                         <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                       ) : (
                                         <RefreshCcw className="h-3 w-3 mr-1" />
                                       )}
                                       Prijzen Ophalen
                                     </Button>
                                   </div>
                                 </AlertDescription>
                               </Alert>
                             )}

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => window.open(searchResults[0].discogs_url, '_blank')}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Discogs
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => window.open(searchResults[0].marketplace_url, '_blank')}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Marketplace
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Condition Assessment Section */}
                  {searchResults.length > 0 && searchResults[0]?.pricing_stats?.lowest_price && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Conditie Assessment
                        </CardTitle>
                        <CardDescription>
                          Selecteer de staat van uw {mediaType === 'vinyl' ? 'LP' : 'CD'} om een adviesprijs te berekenen
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Conditie van de {mediaType === 'vinyl' ? 'LP' : 'CD'}:</label>
                          <Select value={selectedCondition} onValueChange={handleConditionChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Kies de conditie van uw ${mediaType === 'vinyl' ? 'LP' : 'CD'}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(conditionMultipliers).map(([condition, multiplier]) => (
                                <SelectItem key={condition} value={condition}>
                                  {condition} ({multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedCondition && calculatedAdvicePrice && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-800 mb-1">Berekende Adviesprijs:</p>
                                <p className="text-2xl font-bold text-green-900">€{calculatedAdvicePrice.toFixed(2)}</p>
                                <p className="text-xs text-green-700">
                                  Gebaseerd op laagste prijs €{searchResults[0]?.pricing_stats?.lowest_price} × {conditionMultipliers[selectedCondition]}
                                </p>
                              </div>
                              {isSavingCondition && (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {analysisResult?.ocrResults?.catalog_number && searchResults.length === 0 && !isSearching && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Geen Discogs resultaten gevonden voor catalogusnummer: {analysisResult.ocrResults.catalog_number}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* OCR Tab */}
                <TabsContent value="ocr">
                  {analysisResult?.ocrResults ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>OCR Analyse Resultaten</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                      {Object.entries(analysisResult.ocrResults).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-right">{String(value) || 'Niet gevonden'}</span>
                        </div>
                      ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center text-gray-500">
                        Nog geen OCR resultaten beschikbaar
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Discogs Tab */}
                <TabsContent value="discogs" className="space-y-4">
                  {searchResults.length > 0 ? (
                    <>
                      {searchStrategies.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Gebruikte Zoekstrategieën</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {searchStrategies.map((strategy, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {strategy}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {searchResults.map((result, index) => (
                        <Card key={result.id}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                              <span>{result.artist} - {result.title}</span>
                              <Badge variant="secondary">
                                {Math.round(result.similarity_score * 100)}% match
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><strong>Label:</strong> {result.label}</div>
                              <div><strong>Catalogusnummer:</strong> {result.catalog_number}</div>
                              <div><strong>Jaar:</strong> {result.year}</div>
                              <div><strong>Formaat:</strong> {result.format}</div>
                              <div><strong>Land:</strong> {result.country}</div>
                              <div><strong>Genre:</strong> {result.genre}</div>
                            </div>

                            {result.pricing_stats && (
                              <div>
                                <h4 className="font-medium mb-2">Prijsinformatie:</h4>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  {result.pricing_stats.lowest_price && (
                                    <div className="flex items-center gap-1">
                                      <span>Laagste: €{result.pricing_stats.lowest_price}</span>
                                      {getPriceBadge(result.pricing_stats.lowest_price)}
                                    </div>
                                  )}
                                  {result.pricing_stats.median_price && (
                                    <div className="flex items-center gap-1">
                                      <span>Mediaan: €{result.pricing_stats.median_price}</span>
                                      {getPriceBadge(result.pricing_stats.median_price)}
                                    </div>
                                  )}
                                  {result.pricing_stats.highest_price && (
                                    <div className="flex items-center gap-1">
                                      <span>Hoogste: €{result.pricing_stats.highest_price}</span>
                                      {getPriceBadge(result.pricing_stats.highest_price)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-600">
                                  <div>Have: {result.pricing_stats.have_count} | Want: {result.pricing_stats.want_count}</div>
                                  <div>Rating: {result.pricing_stats.avg_rating}/5 ({result.pricing_stats.ratings_count} reviews)</div>
                                  {result.pricing_stats.last_sold && (
                                    <div>Laatst verkocht: {result.pricing_stats.last_sold}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => window.open(result.discogs_url, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Discogs Pagina
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => window.open(result.marketplace_url, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Marketplace
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.api_url)}>
                                <Copy className="h-4 w-4 mr-1" />
                                API URL
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center text-gray-500">
                        Nog geen Discogs resultaten beschikbaar
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinylScanComplete;