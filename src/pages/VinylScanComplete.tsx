import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, RefreshCcw, BarChart3, Camera, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Disc3 } from 'lucide-react';
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
import { scanReducer, initialScanState } from "@/components/ScanStateReducer";

const VinylScanComplete = () => {
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
    console.log('🗄️ performSave called with condition:', condition, 'advicePrice:', advicePrice);
    console.log('🗄️ Stack trace:', new Error().stack);
    if (!analysisResult?.ocr_results || !state.mediaType) return;

    dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: true });
    try {
      const tableName = state.mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      const insertData = state.mediaType === 'vinyl' ? {
        catalog_image: state.uploadedFiles[0],
        matrix_image: state.uploadedFiles[1], 
        additional_image: state.uploadedFiles[2],
        catalog_number: analysisResult.ocr_results.catalog_number,
        matrix_number: analysisResult.ocr_results.matrix_number,
        artist: analysisResult.ocr_results.artist,
        title: analysisResult.ocr_results.title,
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
        artist: analysisResult.ocr_results.artist,
        title: analysisResult.ocr_results.title,
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
              <h1 className="text-3xl font-bold text-gray-900">Music Scan</h1>
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
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Media Type</span>
            <span>Upload</span>
            <span>Analyse</span>
            <span>Prijzen</span>
          </div>
        </div>

        {/* Media Type Selection */}
        {!state.mediaType && (
          <div className="mb-8">
            <MediaTypeSelector onSelectMediaType={handleMediaTypeSelect} />
          </div>
        )}

        {/* Upload Section */}
        {state.mediaType && (
          <div className="mb-8">
            <UploadSection 
              mediaType={state.mediaType}
              uploadedFiles={state.uploadedFiles}
              onFileUploaded={handleFileUploaded}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* Loading States */}
        {isAnalyzing && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>OCR analyse bezig...</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Dit kan tot 60 seconden duren. Barcode is optioneel.
              </div>
            </CardContent>
          </Card>
        )}

        {isSearching && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Discogs zoeken...</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Zoeken naar matching releases en prijzen...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Recovery Section */}
        {state.mediaType && state.uploadedFiles.length > 0 && !isAnalyzing && !analysisResult && !isSearching && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    Analyse problemen?
                  </h3>
                  <p className="text-sm text-amber-800 mb-4">
                    Als de analyse is vastgelopen of een timeout heeft, probeer dan:
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={retryAnalysis}
                      variant="outline"
                      size="sm"
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Analyse Opnieuw
                    </Button>
                    <Button 
                      onClick={resetScan}
                      variant="outline"
                      size="sm"
                      className="bg-red-100 hover:bg-red-200 text-red-900 border-red-300 ml-2"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Volledige Reset
                    </Button>
                  </div>
                  <div className="text-xs text-amber-700 mt-2">
                    💡 Tip: Zorg dat foto's helder zijn en probeer opnieuw als het vastloopt
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Error Recovery */}
        {analysisResult && !isSearching && searchResults.length === 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Search className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Geen Discogs resultaten
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Geen matching releases gevonden. Dit kan gebeuren als:
                  </p>
                  <ul className="text-sm text-blue-800 mb-4 space-y-1">
                    <li>• Barcode ontbreekt (niet fataal)</li>
                    <li>• Catalogusnummer onduidelijk is</li>
                    <li>• Release niet op Discogs staat</li>
                    <li>• Zoeken is getimed out</li>
                  </ul>
                  <div className="space-y-2">
                    <Button 
                      onClick={retrySearchWithPricing}
                      variant="outline"
                      size="sm"
                      className="bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Zoeken Opnieuw
                    </Button>
                    <Button 
                      onClick={retryAnalysis}
                      variant="outline"
                      size="sm"
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 ml-2"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Analyse Opnieuw
                    </Button>
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    💡 Tip: Controleer of artiest/titel correct zijn gedetecteerd
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {analysisResult && searchResults.length > 0 && (
          <div className="mb-8">
            <ScanResults 
              analysisResult={analysisResult}
              searchResults={searchResults}
              searchStrategies={searchStrategies}
              mediaType={state.mediaType!}
              onCopyToClipboard={copyToClipboard}
              onRetryPricing={retrySearchWithPricing}
              isPricingRetrying={isPricingRetrying}
            />
          </div>
        )}

        {/* Condition Selector */}
        {searchResults.length > 0 && searchResults[0]?.pricing_stats?.lowest_price && (
          <div className="mb-8">
            <ConditionSelector
              mediaType={state.mediaType!}
              selectedCondition={state.selectedCondition}
              lowestPrice={searchResults[0]?.pricing_stats?.lowest_price}
              calculatedAdvicePrice={state.calculatedAdvicePrice}
              isSaving={state.isSavingCondition}
              onConditionChange={handleConditionChange}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Duplicate Warning Dialog */}
        <AlertDialog open={state.showDuplicateDialog} onOpenChange={(open) => 
          dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: open })
        }>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Mogelijk Duplicaat Gevonden
              </AlertDialogTitle>
              <AlertDialogDescription>
                Er zijn {state.duplicateRecords.length} albums gevonden die lijken op wat je wilt toevoegen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              {state.duplicateRecords.map((duplicate, index) => (
                <div key={duplicate.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-900 mb-2">
                    Bestaand album #{index + 1}:
                  </h4>
                  <div className="text-sm text-amber-800 space-y-1">
                    <div><strong>Artiest:</strong> {duplicate.artist || 'Onbekend'}</div>
                    <div><strong>Titel:</strong> {duplicate.title || 'Onbekend'}</div>
                    <div><strong>Catalogusnummer:</strong> {duplicate.catalog_number || 'Niet gevonden'}</div>
                  </div>
                </div>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSave}>
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveAnyway}>
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