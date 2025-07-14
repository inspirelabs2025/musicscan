import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Disc3, Search, ExternalLink, Copy, CheckCircle, AlertCircle, RefreshCcw, Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileUpload } from '@/components/FileUpload';
import { useVinylAnalysis } from '@/hooks/useVinylAnalysis';
import { useCDAnalysis } from '@/hooks/useCDAnalysis';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Navigation } from "@/components/Navigation";

const VinylScanComplete = () => {
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [calculatedAdvicePrice, setCalculatedAdvicePrice] = useState<number | null>(null);
  const [isSavingCondition, setIsSavingCondition] = useState(false);
  const [completedScanData, setCompletedScanData] = useState<any>(null);
  const [duplicateRecords, setDuplicateRecords] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{condition: string, advicePrice: number} | null>(null);
  
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
    setSearchResults,
    retryPricing,
    isPricingRetrying
  } = useDiscogsSearch();

  // Auto-trigger analysis when photos are uploaded
  useEffect(() => {
    if (!mediaType || !analyzeImages) return;
    const requiredPhotos = mediaType === 'vinyl' ? 3 : 4; // vinyl: cover, back, matrix/label | CD: front, back, barcode, matrix
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

  // Condition multipliers based on lowest price (unified for vinyl and CD)
  const vinylConditionMultipliers: Record<string, number> = {
    'Mint (M)': 2.0,
    'Near Mint (NM or M-)': 1.8,
    'Very Good Plus (VG+)': 1.5,
    'Very Good (VG)': 1.0,
    'Good Plus (G+)': 0.8,
    'Good (G)': 0.6,
    'Fair (F) / Poor (P)': 0.4
  };

  const cdConditionMultipliers: Record<string, number> = {
    'Mint (M)': 2.0,
    'Near Mint (NM)': 1.8,
    'Very Good Plus (VG+)': 1.5,
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

  // Check for existing duplicates in database
  const checkForDuplicates = async (artist: string, title: string, catalogNumber: string) => {
    try {
      const tableName = mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      // First check for exact match (artist + title + catalog)
      let query = supabase
        .from(tableName)
        .select('*');
      
      if (catalogNumber && catalogNumber.trim()) {
        query = query
          .ilike('artist', `%${artist}%`)
          .ilike('title', `%${title}%`)
          .eq('catalog_number', catalogNumber);
      } else {
        // If no catalog number, check artist + title only
        query = query
          .ilike('artist', `%${artist}%`)
          .ilike('title', `%${title}%`);
      }
      
      const { data: exactMatches, error } = await query;
      
      if (error) throw error;
      
      return exactMatches || [];
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return [];
    }
  };

  // Save final scan to database with all data including condition and advice price
  const saveFinalScan = async (condition: string, advicePrice: number) => {
    if (!analysisResult?.ocrResults || !mediaType) return;

    // Check for duplicates first
    const { artist, title, catalog_number } = analysisResult.ocrResults;
    const duplicates = await checkForDuplicates(artist || '', title || '', catalog_number || '');
    
    if (duplicates.length > 0) {
      setDuplicateRecords(duplicates);
      setPendingSaveData({ condition, advicePrice });
      setShowDuplicateDialog(true);
      return;
    }

    // No duplicates found, proceed with save
    await performSave(condition, advicePrice);
  };

  // Perform the actual database save
  const performSave = async (condition: string, advicePrice: number) => {
    if (!analysisResult?.ocrResults || !mediaType) return;

    setIsSavingCondition(true);
    try {
      const tableName = mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      // Prepare insert data based on media type
      const insertData = mediaType === 'vinyl' ? {
        catalog_image: uploadedFiles[0],
        matrix_image: uploadedFiles[1], 
        additional_image: uploadedFiles[2],
        catalog_number: analysisResult.ocrResults.catalog_number,
        matrix_number: analysisResult.ocrResults.matrix_number,
        artist: analysisResult.ocrResults.artist,
        title: analysisResult.ocrResults.title,
        year: analysisResult.ocrResults.year ? parseInt(analysisResult.ocrResults.year) : null,
        format: 'Vinyl',
        label: analysisResult.ocrResults.label,
        genre: analysisResult.ocrResults.genre,
        country: analysisResult.ocrResults.country,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.id || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null
      } : {
        front_image: uploadedFiles[0],
        back_image: uploadedFiles[1],
        barcode_image: uploadedFiles[2],
        matrix_image: uploadedFiles[3],
        barcode_number: analysisResult.ocrResults.barcode,
        artist: analysisResult.ocrResults.artist,
        title: analysisResult.ocrResults.title,
        label: analysisResult.ocrResults.label,
        catalog_number: analysisResult.ocrResults.catalog_number,
        year: analysisResult.ocrResults.year,
        format: 'CD',
        genre: analysisResult.ocrResults.genre,
        country: analysisResult.ocrResults.country,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.id || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setCompletedScanData(data);
      
      toast({
        title: "Scan Voltooid! ✅",
        description: `${mediaType === 'vinyl' ? 'LP' : 'CD'} opgeslagen met adviesprijs: €${advicePrice.toFixed(2)}`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error saving final ${mediaType} scan:`, error);
      toast({
        title: "Fout bij Opslaan",
        description: "Kon scan niet opslaan in database",
        variant: "destructive"
      });
    } finally {
      setIsSavingCondition(false);
    }
  };

  // Handle duplicate dialog actions
  const handleSaveAnyway = () => {
    if (pendingSaveData) {
      performSave(pendingSaveData.condition, pendingSaveData.advicePrice);
    }
    setShowDuplicateDialog(false);
    setPendingSaveData(null);
    setDuplicateRecords([]);
  };

  const handleCancelSave = () => {
    setShowDuplicateDialog(false);
    setPendingSaveData(null);
    setDuplicateRecords([]);
    setIsSavingCondition(false);
  };

  // Handle condition selection
  const handleConditionChange = (condition: string) => {
    setSelectedCondition(condition);
    
    const lowestPrice = searchResults[0]?.pricing_stats?.lowest_price;
    if (lowestPrice) {
      const advicePrice = calculateAdvicePrice(condition, lowestPrice);
      if (advicePrice) {
        setCalculatedAdvicePrice(advicePrice);
        // Don't save automatically anymore - wait for explicit save action
      }
    }
  };

  // Handle explicit save action
  const handleSaveToDatabase = async () => {
    if (selectedCondition && calculatedAdvicePrice) {
      await saveFinalScan(selectedCondition, calculatedAdvicePrice);
    }
  };

  // Retry complete search with pricing
  const retrySearchWithPricing = async () => {
    if (!analysisResult?.ocrResults?.catalog_number) return;
    
    const { artist, title, catalog_number } = analysisResult.ocrResults;
    setCurrentStep(3);
    await searchCatalog(catalog_number, artist, title, true);
  };

  const resetScan = () => {
    setCurrentStep(1);
    setUploadedFiles([]);
    setVinylAnalysisResult(null);
    setCDAnalysisResult(null);
    setSelectedCondition('');
    setCalculatedAdvicePrice(null);
    setSearchResults([]);
    setCompletedScanData(null);
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
            <Navigation />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Music Scan</h1>
              
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
                  Foto Upload ({uploadedFiles.length}/{mediaType === 'vinyl' ? 3 : 4})
                </CardTitle>
                <CardDescription>
                  {mediaType === 'vinyl' 
                    ? 'Upload 3 foto\'s: voorkant, achterkant, en label'
                    : 'Upload 4 foto\'s: voorkant, achterkant, barcode, en matrix code'
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
                    {(mediaType === 'vinyl' ? [0, 1, 2] : [0, 1, 2, 3]).map((index) => (
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
                            index === 2 ? "Upload barcode van de CD" :
                            "Upload matrix code van de CD"
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
                {uploadedFiles.length === (mediaType === 'vinyl' ? 3 : 4) && (
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
                                      onClick={retrySearchWithPricing}
                                      disabled={isSearching || isPricingRetrying}
                                      className="h-8"
                                    >
                                      {(isSearching || isPricingRetrying) ? (
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
                                        onClick={retrySearchWithPricing}
                                        disabled={isSearching || isPricingRetrying}
                                        className="ml-2 h-8"
                                      >
                                        {(isSearching || isPricingRetrying) ? (
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
                                  {condition} ({Math.round(multiplier * 100)}% van low price)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                         {selectedCondition && calculatedAdvicePrice && (
                           <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                             <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-800 mb-1">
                                  {completedScanData ? 'Scan Voltooid! Adviesprijs:' : 'Berekende Adviesprijs:'}
                                </p>
                                <p className="text-2xl font-bold text-green-900">€{calculatedAdvicePrice.toFixed(2)}</p>
                                <p className="text-xs text-green-700">
                                  {completedScanData 
                                    ? `${mediaType === 'vinyl' ? 'LP' : 'CD'} succesvol opgeslagen in database`
                                    : `Gebaseerd op laagste prijs €${searchResults[0]?.pricing_stats?.lowest_price} × ${conditionMultipliers[selectedCondition]}`
                                  }
                                </p>
                              </div>
                               {isSavingCondition && (
                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                               )}
                             </div>
                             {!completedScanData && !isSavingCondition && (
                               <div className="mt-4 pt-4 border-t border-green-300">
                                 <Button 
                                   onClick={handleSaveToDatabase}
                                   className="w-full bg-green-600 hover:bg-green-700 text-white"
                                   disabled={isSavingCondition}
                                 >
                                   <CheckCircle className="h-4 w-4 mr-2" />
                                   Opslaan in Database
                                 </Button>
                               </div>
                             )}
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

        {/* Navigation Buttons */}
        {(analysisResult || searchResults.length > 0) && (
          <div className="mt-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={resetScan} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Scan Another Item
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/catalog-test')} className="flex-1">
                    <Search className="mr-2 h-4 w-4" />
                    Search Catalog
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/collection-overview')} className="flex-1">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Duplicate Warning Dialog */}
        <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Mogelijk Duplicaat Gevonden
              </AlertDialogTitle>
              <AlertDialogDescription>
                Er {duplicateRecords.length === 1 ? 'is een album' : `zijn ${duplicateRecords.length} albums`} gevonden die lijken op wat je wilt toevoegen:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Nieuw album dat wordt toegevoegd:</h4>
                <div className="text-sm text-blue-800">
                  <div><strong>Artiest:</strong> {analysisResult?.ocrResults?.artist || 'Onbekend'}</div>
                  <div><strong>Titel:</strong> {analysisResult?.ocrResults?.title || 'Onbekend'}</div>
                  <div><strong>Catalogusnummer:</strong> {analysisResult?.ocrResults?.catalog_number || 'Niet gevonden'}</div>
                  {pendingSaveData && (
                    <>
                      <div><strong>Conditie:</strong> {pendingSaveData.condition}</div>
                      <div><strong>Adviesprijs:</strong> €{pendingSaveData.advicePrice.toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>

              {duplicateRecords.map((duplicate, index) => (
                <div key={duplicate.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-900 mb-2">
                    Bestaand album #{index + 1} in collectie:
                  </h4>
                  <div className="text-sm text-amber-800 space-y-1">
                    <div><strong>Artiest:</strong> {duplicate.artist || 'Onbekend'}</div>
                    <div><strong>Titel:</strong> {duplicate.title || 'Onbekend'}</div>
                    <div><strong>Catalogusnummer:</strong> {duplicate.catalog_number || 'Niet gevonden'}</div>
                    {duplicate.condition_grade && (
                      <div><strong>Conditie:</strong> {duplicate.condition_grade}</div>
                    )}
                    {duplicate.calculated_advice_price && (
                      <div><strong>Adviesprijs:</strong> €{duplicate.calculated_advice_price}</div>
                    )}
                    <div className="text-xs text-amber-600">
                      Toegevoegd: {new Date(duplicate.created_at).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleCancelSave} className="order-2 sm:order-1">
                Annuleren
              </AlertDialogCancel>
              <Button 
                variant="outline" 
                onClick={() => navigate('/collection-overview')}
                className="order-3 sm:order-2"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Bekijk Collectie
              </Button>
              <AlertDialogAction onClick={handleSaveAnyway} className="order-1 sm:order-3">
                Toch Toevoegen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default VinylScanComplete;