import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, RefreshCcw, BarChart3, Camera, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Disc3, Archive } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileUpload } from '@/components/FileUpload';
import { useVinylAnalysis } from '@/hooks/useVinylAnalysis';
import { useCDAnalysis } from '@/hooks/useCDAnalysis';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Navigation } from "@/components/Navigation";
import { extractDiscogsIdFromUrl } from "@/lib/utils";
import { MediaTypeSelector } from "@/components/MediaTypeSelector";
import { UploadSection } from "@/components/UploadSection";
import { ScanResults } from "@/components/ScanResults";
import { ConditionSelector } from "@/components/ConditionSelector";
import { ManualSearch } from "@/components/ManualSearch";
import { scanReducer, initialScanState } from "@/components/ScanStateReducer";

const BulkerImage = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(scanReducer, initialScanState);

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

  const {
    isSearching,
    searchResults,
    searchStrategies,
    searchCatalog,
    setSearchResults,
    retryPricing,
    isPricingRetrying,
    clearCache,
    resetSearchState
  } = useDiscogsSearch();

  // Memoized derived state
  const isAnalyzing = useMemo(() => 
    state.mediaType === 'vinyl' ? isAnalyzingVinyl : (state.mediaType === 'cd' ? isAnalyzingCD : false),
    [state.mediaType, isAnalyzingVinyl, isAnalyzingCD]
  );

  const analysisResult = useMemo(() => 
    state.mediaType === 'vinyl' ? vinylAnalysisResult : (state.mediaType === 'cd' ? cdAnalysisResult : null),
    [state.mediaType, vinylAnalysisResult, cdAnalysisResult]
  );

  const analyzeImages = useMemo(() => 
    state.mediaType === 'vinyl' ? analyzeVinylImages : (state.mediaType === 'cd' ? analyzeCDImages : null),
    [state.mediaType, analyzeVinylImages, analyzeCDImages]
  );

  const setAnalysisResult = useMemo(() => 
    state.mediaType === 'vinyl' ? setVinylAnalysisResult : (state.mediaType === 'cd' ? setCDAnalysisResult : null),
    [state.mediaType, setVinylAnalysisResult, setCDAnalysisResult]
  );

  // Memoized condition multipliers
  const conditionMultipliers = useMemo(() => {
    if (state.mediaType === 'vinyl') {
      return {
        'Mint (M)': 2.0,
        'Near Mint (NM or M-)': 1.8,
        'Very Good Plus (VG+)': 1.5,
        'Very Good (VG)': 1.0,
        'Good Plus (G+)': 0.8,
        'Good (G)': 0.6,
        'Fair (F) / Poor (P)': 0.4
      };
    } else if (state.mediaType === 'cd') {
      return {
        'Mint (M)': 2.0,
        'Near Mint (NM)': 1.8,
        'Very Good Plus (VG+)': 1.5,
        'Very Good (VG)': 1.0,
        'Good Plus (G+)': 0.8,
        'Good (G)': 0.6,
        'Fair (F) / Poor (P)': 0.4
      };
    }
    return {};
  }, [state.mediaType]);

  // Auto-trigger analysis when photos are uploaded
  useEffect(() => {
    if (!state.mediaType || !analyzeImages) return;
    const requiredPhotos = state.mediaType === 'vinyl' ? 3 : 4;
    if (state.uploadedFiles.length >= requiredPhotos && !isAnalyzing && !analysisResult) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
      analyzeImages(state.uploadedFiles);
    }
  }, [state.uploadedFiles, isAnalyzing, analysisResult, analyzeImages, state.mediaType]);

  // Auto-trigger Discogs search when OCR analysis completes - now barcode optional
  useEffect(() => {
    if (analysisResult?.ocr_results && !isSearching && searchResults.length === 0) {
      const { artist, title, catalog_number } = analysisResult.ocr_results;
      
      // Check if we have enough data to search (catalog_number OR artist+title)
      if (catalog_number?.trim() || (artist?.trim() && title?.trim())) {
        dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
        
        const timeoutId = setTimeout(() => {
          searchCatalog(catalog_number || '', artist, title);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      } else {
        console.log('⚠️ Not enough data for Discogs search - need catalog_number OR artist+title');
      }
    }
  }, [analysisResult?.ocr_results, isSearching, searchResults.length, searchCatalog]);

  // Update step when search completes
  useEffect(() => {
    if (searchResults.length > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
    }
  }, [searchResults]);

  // Memoized functions
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: "Tekst is gekopieerd naar klembord",
      variant: "default"
    });
  }, []);

  const calculateAdvicePrice = useCallback((condition: string, lowestPrice: string | null) => {
    if (!condition || !lowestPrice) return null;
    let price = parseFloat(lowestPrice.replace(',', '.'));
    
    if (price < 1.00) {
      price = 1.00;
    }
    
    const multiplier = conditionMultipliers[condition];
    return Math.round(price * multiplier * 100) / 100;
  }, [conditionMultipliers]);

  const checkForDuplicates = useCallback(async (artist: string, title: string, catalogNumber: string) => {
    try {
      const tableName = state.mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      let query = supabase.from(tableName).select('*');
      
      if (catalogNumber && catalogNumber.trim()) {
        query = query
          .ilike('artist', `%${artist}%`)
          .ilike('title', `%${title}%`)
          .eq('catalog_number', catalogNumber);
      } else {
        query = query
          .ilike('artist', `%${artist}%`)
          .ilike('title', `%${title}%`);
      }
      
      const { data: exactMatches, error } = await query;
      
      if (error) throw error;
      
      return exactMatches || [];
    } catch (error) {
      return [];
    }
  }, [state.mediaType]);

  const performSave = useCallback(async (condition: string, advicePrice: number) => {
    if (!analysisResult?.ocr_results || !state.mediaType) return;
    
    dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: true });

    try {
      const tableName = state.mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      // Helper function to get best available data (Discogs > OCR)
      const getBestData = (discogsValue: string | undefined, ocrValue: string | undefined) => {
        const cleanDiscogs = discogsValue?.trim();
        const cleanOcr = ocrValue?.trim();
        
        // Prioritize Discogs data if it exists and is not empty/Unknown
        if (cleanDiscogs && cleanDiscogs !== '' && cleanDiscogs.toLowerCase() !== 'unknown') {
          console.log('🎯 Using Discogs data:', cleanDiscogs);
          return cleanDiscogs;
        }
        
        // Fallback to OCR data
        console.log('📝 Using OCR data:', cleanOcr);
        return cleanOcr;
      };
      
      const bestArtist = getBestData(searchResults[0]?.artist, analysisResult.ocr_results.artist);
      const bestTitle = getBestData(searchResults[0]?.title, analysisResult.ocr_results.title);
      
      console.log('💾 Saving with artist:', bestArtist, 'title:', bestTitle);
      
      const insertData = state.mediaType === 'vinyl' ? {
        catalog_image: state.uploadedFiles[0],
        matrix_image: state.uploadedFiles[1], 
        additional_image: state.uploadedFiles[2],
        catalog_number: analysisResult.ocr_results.catalog_number,
        matrix_number: analysisResult.ocr_results.matrix_number,
        artist: bestArtist,
        title: bestTitle,
        year: analysisResult.ocr_results.year ? parseInt(analysisResult.ocr_results.year) : null,
        format: 'Vinyl',
        label: analysisResult.ocr_results.label,
        genre: analysisResult.ocr_results.genre,
        country: analysisResult.ocr_results.country,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url) || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null
      } : {
        front_image: state.uploadedFiles[0],
        back_image: state.uploadedFiles[1],
        barcode_image: state.uploadedFiles[2],
        matrix_image: state.uploadedFiles[3],
        barcode_number: analysisResult.ocr_results.barcode,
        artist: bestArtist,
        title: bestTitle,
        label: analysisResult.ocr_results.label,
        catalog_number: analysisResult.ocr_results.catalog_number,
        year: analysisResult.ocr_results.year,
        format: 'CD',
        genre: analysisResult.ocr_results.genre,
        country: analysisResult.ocr_results.country,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url) || null,
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

      dispatch({ type: 'SET_COMPLETED_SCAN_DATA', payload: data });
      
      toast({
        title: "Scan Voltooid! ✅",
        description: `${state.mediaType === 'vinyl' ? 'LP' : 'CD'} opgeslagen met adviesprijs: €${advicePrice.toFixed(2)}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Fout bij Opslaan",
        description: "Kon scan niet opslaan in database",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: false });
    }
  }, [analysisResult, state.mediaType, state.uploadedFiles, searchResults]);

  const saveFinalScan = useCallback(async (condition: string, advicePrice: number) => {
    console.log('🚀 saveFinalScan called with condition:', condition, 'advicePrice:', advicePrice);
    if (!analysisResult?.ocr_results || !state.mediaType) return;

    const { artist, title, catalog_number } = analysisResult.ocr_results;
    const duplicates = await checkForDuplicates(artist || '', title || '', catalog_number || '');
    
    if (duplicates.length > 0) {
      dispatch({ type: 'SET_DUPLICATE_RECORDS', payload: duplicates });
      dispatch({ type: 'SET_PENDING_SAVE_DATA', payload: { condition, advicePrice } });
      dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: true });
      return;
    }

    await performSave(condition, advicePrice);
  }, [analysisResult, state.mediaType, checkForDuplicates, performSave]);

  // Event handlers
  const handleMediaTypeSelect = useCallback((type: 'vinyl' | 'cd') => {
    dispatch({ type: 'SET_MEDIA_TYPE', payload: type });
  }, []);

  const handleFileUploaded = useCallback((url: string) => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [...state.uploadedFiles, url] });
  }, [state.uploadedFiles]);

  const handleConditionChange = useCallback((condition: string) => {
    console.log('🔄 handleConditionChange called with condition:', condition);
    dispatch({ type: 'SET_SELECTED_CONDITION', payload: condition });
    
    const lowestPrice = searchResults[0]?.pricing_stats?.lowest_price;
    if (lowestPrice) {
      const advicePrice = calculateAdvicePrice(condition, lowestPrice);
      if (advicePrice) {
        console.log('💰 Setting calculated advice price:', advicePrice);
        dispatch({ type: 'SET_CALCULATED_ADVICE_PRICE', payload: advicePrice });
      }
    }
  }, [searchResults, calculateAdvicePrice]);

  const handleSave = useCallback(async () => {
    console.log('💾 handleSave called with condition:', state.selectedCondition, 'advicePrice:', state.calculatedAdvicePrice);
    if (!state.selectedCondition || !state.calculatedAdvicePrice) {
      toast({
        title: "Kan niet opslaan",
        description: "Selecteer eerst een conditie en zorg dat prijsscan compleet is",
        variant: "destructive"
      });
      return;
    }
    
    await saveFinalScan(state.selectedCondition, state.calculatedAdvicePrice);
  }, [state.selectedCondition, state.calculatedAdvicePrice, saveFinalScan]);

  const handleSaveAnyway = useCallback(() => {
    if (state.pendingSaveData) {
      performSave(state.pendingSaveData.condition, state.pendingSaveData.advicePrice);
    }
    dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: false });
    dispatch({ type: 'SET_PENDING_SAVE_DATA', payload: null });
    dispatch({ type: 'SET_DUPLICATE_RECORDS', payload: [] });
  }, [state.pendingSaveData, performSave]);

  const handleCancelSave = useCallback(() => {
    dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: false });
    dispatch({ type: 'SET_PENDING_SAVE_DATA', payload: null });
    dispatch({ type: 'SET_DUPLICATE_RECORDS', payload: [] });
    dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: false });
  }, []);

  const resetScan = useCallback(() => {
    dispatch({ type: 'RESET_SCAN' });
    setVinylAnalysisResult(null);
    setCDAnalysisResult(null);
    setSearchResults([]);
    resetSearchState();
    clearCache();
  }, [setVinylAnalysisResult, setCDAnalysisResult, setSearchResults, resetSearchState, clearCache]);

  const retrySearchWithPricing = useCallback(async () => {
    if (!analysisResult?.ocr_results?.catalog_number) return;
    
    const { artist, title, catalog_number } = analysisResult.ocr_results;
    setSearchResults([]);
    resetSearchState();
    dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
    await searchCatalog(catalog_number, artist, title, true, true);
  }, [analysisResult, searchCatalog, setSearchResults, resetSearchState]);

  const handleRetryPricing = useCallback(() => {
    if (searchResults[0]?.discogs_id || searchResults[0]?.id) {
      const discogsId = searchResults[0]?.discogs_id || searchResults[0]?.id;
      retryPricing(discogsId);
    }
  }, [searchResults, retryPricing]);

  const retryAnalysis = useCallback(async () => {
    if (!analyzeImages || state.uploadedFiles.length === 0) return;
    
    // Reset analysis result and search state
    setAnalysisResult?.(null);
    setSearchResults([]);
    resetSearchState();
    clearCache();
    
    // Retry analysis
    dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
    await analyzeImages(state.uploadedFiles);
  }, [analyzeImages, state.uploadedFiles, setAnalysisResult, setSearchResults, resetSearchState, clearCache]);

  const getProgress = useMemo(() => {
    if (state.currentStep === 1) return 0;
    if (state.currentStep === 2) return 33;
    if (state.currentStep === 3) return 66;
    return 100;
  }, [state.currentStep]);

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
              <h1 className="text-3xl font-bold text-gray-900">Bulk Image Scan</h1>
            </div>
          </div>
          {(analysisResult || searchResults.length > 0 || state.uploadedFiles.length > 0) && (
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

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={getProgress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className={state.currentStep >= 1 ? "text-blue-600 font-semibold" : ""}>Media Type</span>
            <span className={state.currentStep >= 2 ? "text-blue-600 font-semibold" : ""}>Upload</span>
            <span className={state.currentStep >= 3 ? "text-blue-600 font-semibold" : ""}>Analysis</span>
            <span className={state.currentStep >= 4 ? "text-blue-600 font-semibold" : ""}>Results</span>
          </div>
        </div>

        {state.completedScanData ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Scan Succesvol Voltooid! 
              </CardTitle>
              <CardDescription className="text-green-700">
                {state.mediaType === 'vinyl' ? 'LP' : 'CD'} is opgeslagen in je collectie met adviesprijs: €{state.calculatedAdvicePrice?.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Artiest:</strong> {state.completedScanData.artist}</p>
                  <p><strong>Titel:</strong> {state.completedScanData.title}</p>
                  <p><strong>Label:</strong> {state.completedScanData.label}</p>
                  <p><strong>Catalogusnummer:</strong> {state.completedScanData.catalog_number}</p>
                </div>
                <div>
                  <p><strong>Jaar:</strong> {state.completedScanData.year}</p>
                  <p><strong>Genre:</strong> {state.completedScanData.genre}</p>
                  <p><strong>Land:</strong> {state.completedScanData.country}</p>
                  <p><strong>Conditie:</strong> {state.completedScanData.condition_grade}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={resetScan} variant="outline" className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Nieuwe Scan
                </Button>
                <Button onClick={() => navigate('/collection-overview')} className="flex-1">
                  <Archive className="h-4 w-4 mr-2" />
                  Bekijk Collectie
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Media Type Selection */}
            {!state.mediaType && (
              <MediaTypeSelector 
                onSelectMediaType={handleMediaTypeSelect}
              />
            )}

            {/* Step 2: Upload Section */}
            {state.currentStep >= 2 && state.mediaType && (
              <UploadSection 
                mediaType={state.mediaType}
                uploadedFiles={state.uploadedFiles}
                onFileUploaded={handleFileUploaded}
                isAnalyzing={isAnalyzing}
              />
            )}

            {/* Loading State for Analysis */}
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-lg font-medium">Bezig met OCR analyse...</span>
                  </div>
                  <p className="text-center text-gray-600 mt-2">
                    De afbeeldingen worden geanalyseerd om tekst te herkennen
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Error Recovery */}
            {analysisResult && analysisResult.error && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    OCR Analyse Mislukt
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Er is een fout opgetreden tijdens de analyse van de afbeeldingen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-100 p-3 rounded-md mb-4">
                    <p className="text-sm text-red-800">{analysisResult.error}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={retryAnalysis} variant="outline" size="sm">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Opnieuw Proberen
                    </Button>
                    <Button onClick={resetScan} variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Nieuwe Foto's
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Search Results */}
            {analysisResult && !analysisResult.error && (
              <>
                {/* Loading State for Search */}
                {isSearching && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-lg font-medium">Zoeken op Discogs...</span>
                      </div>
                      <p className="text-center text-gray-600 mt-2">
                        Bezig met zoeken naar het album en prijsinformatie
                      </p>
                      {searchStrategies && searchStrategies.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm text-gray-600 text-center">Zoekstrategieën gebruikt:</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {searchStrategies.map((strategy, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {strategy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Retry Search Pricing */}
                {searchResults.length > 0 && !searchResults[0]?.pricing_stats && !isSearching && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="text-yellow-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Prijsinformatie Niet Gevonden
                      </CardTitle>
                      <CardDescription className="text-yellow-700">
                        Het album is gevonden, maar er is geen prijsinformatie beschikbaar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          onClick={retrySearchWithPricing} 
                          variant="outline" 
                          size="sm"
                          disabled={isPricingRetrying}
                        >
                          {isPricingRetrying ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4 mr-2" />
                          )}
                          Opnieuw Zoeken met Prijzen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Search Error Recovery */}
                {!isSearching && searchResults.length === 0 && analysisResult?.ocr_results && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Geen Resultaten Gevonden
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        Automatische zoekopdracht heeft geen resultaten opgeleverd. Probeer handmatig zoeken.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ManualSearch 
                        analysisResult={analysisResult}
                        onResultsFound={setSearchResults}
                        mediaType={state.mediaType}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Scan Results */}
                {searchResults.length > 0 && (
                  <ScanResults 
                    searchResults={searchResults}
                    analysisResult={analysisResult}
                    searchStrategies={searchStrategies}
                    mediaType={state.mediaType}
                    onCopyToClipboard={copyToClipboard}
                    onRetryPricing={handleRetryPricing}
                    isPricingRetrying={isPricingRetrying}
                  />
                )}

                {/* Step 4: Condition Selection */}
                {searchResults.length > 0 && searchResults[0]?.pricing_stats && (
                  <ConditionSelector 
                    mediaType={state.mediaType}
                    onConditionChange={handleConditionChange}
                    selectedCondition={state.selectedCondition}
                    lowestPrice={searchResults[0]?.pricing_stats?.lowest_price}
                    onSave={handleSave}
                    isSaving={state.isSavingCondition}
                    calculatedAdvicePrice={state.calculatedAdvicePrice}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Duplicate Warning Dialog */}
        <AlertDialog open={state.showDuplicateDialog} onOpenChange={(open) => !open && handleCancelSave()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Mogelijke Duplicaten Gevonden
              </AlertDialogTitle>
              <AlertDialogDescription>
                Er zijn {state.duplicateRecords.length} vergelijkbare record(s) gevonden in je collectie. 
                Wil je toch doorgaan met opslaan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {state.duplicateRecords.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                {state.duplicateRecords.map((record, index) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
                    <p><strong>{record.artist}</strong> - {record.title}</p>
                    <p className="text-gray-600">
                      {record.catalog_number && `Cat: ${record.catalog_number} • `}
                      {record.condition_grade && `${record.condition_grade} • `}
                      {record.calculated_advice_price && `€${record.calculated_advice_price}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSave}>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveAnyway}>Toch Opslaan</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BulkerImage;