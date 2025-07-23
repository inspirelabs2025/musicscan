import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertTriangle, RefreshCcw, BarChart3, Camera, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Disc3, Store } from 'lucide-react';
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
import { extractDiscogsIdFromUrl } from "@/lib/utils";
import { MediaTypeSelector } from "@/components/MediaTypeSelector";
import { UploadSection } from "@/components/UploadSection";
import { ScanResults } from "@/components/ScanResults";
import { ConditionSelector } from "@/components/ConditionSelector";
import { ManualSearch } from "@/components/ManualSearch";
import { DiscogsIdInput } from "@/components/DiscogsIdInput";
import { SearchingLoadingCard } from "@/components/SearchingLoadingCard";
import { scanReducer, initialScanState } from "@/components/ScanStateReducer";
import { useAuth } from "@/contexts/AuthContext";
import { HeroSection } from "@/components/HeroSection";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(scanReducer, initialScanState);
  const { user } = useAuth();

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
    searchByDiscogsId,
    setSearchResults,
    retryPricing,
    isPricingRetrying,
    clearCache,
    resetSearchState
  } = useDiscogsSearch();

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

  useEffect(() => {
    if (!state.mediaType || !analyzeImages) return;
    const requiredPhotos = state.mediaType === 'vinyl' ? 3 : 4;
    if (state.uploadedFiles.length >= requiredPhotos && !isAnalyzing && !analysisResult) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
      analyzeImages(state.uploadedFiles);
    }
  }, [state.uploadedFiles, isAnalyzing, analysisResult, analyzeImages, state.mediaType]);

  useEffect(() => {
    if (analysisResult?.analysis && !isSearching && searchResults.length === 0) {
      const { artist, title, catalog_number } = analysisResult.analysis;
      
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
  }, [analysisResult?.analysis, isSearching, searchResults.length, searchCatalog]);

  useEffect(() => {
    if (searchResults.length > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
    }
  }, [searchResults]);

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
    if ((!analysisResult?.analysis && !state.discogsIdMode) || !state.mediaType) return;
    
    dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: true });

    try {
      const tableName = state.mediaType === 'vinyl' ? 'vinyl2_scan' : 'cd_scan';
      
      const getBestData = (discogsValue: string | undefined, ocrValue: string | undefined) => {
        const cleanDiscogs = discogsValue?.trim();
        const cleanOcr = ocrValue?.trim();
        
        if (cleanDiscogs && cleanDiscogs !== '' && cleanDiscogs.toLowerCase() !== 'unknown') {
          console.log('🎯 Using Discogs data:', cleanDiscogs);
          return cleanDiscogs;
        }
        
        console.log('📝 Using OCR data:', cleanOcr);
        return cleanOcr;
      };
      
      const bestArtist = state.discogsIdMode 
        ? searchResults[0]?.artist || 'Unknown'
        : getBestData(searchResults[0]?.artist, analysisResult?.analysis?.artist);
      const bestTitle = state.discogsIdMode 
        ? searchResults[0]?.title || 'Unknown'
        : getBestData(searchResults[0]?.title, analysisResult?.analysis?.title);
      
      console.log('💾 Saving with artist:', bestArtist, 'title:', bestTitle);
      
      const insertData = state.mediaType === 'vinyl' ? {
        catalog_image: state.uploadedFiles[0] || null,
        matrix_image: state.uploadedFiles[1] || null, 
        additional_image: state.uploadedFiles[2] || null,
        catalog_number: analysisResult?.analysis?.catalog_number || searchResults[0]?.catalog_number || null,
        matrix_number: analysisResult?.analysis?.matrix_number || null,
        artist: bestArtist,
        title: bestTitle,
        year: analysisResult?.analysis?.year ? parseInt(analysisResult.analysis.year) : (searchResults[0]?.year || null),
        format: 'Vinyl',
        label: analysisResult?.analysis?.label || searchResults[0]?.label || null,
        genre: analysisResult?.analysis?.genre || searchResults[0]?.genre || null,
        country: analysisResult?.analysis?.country || searchResults[0]?.country || null,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url) || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null,
        user_id: user?.id
      } : {
        front_image: state.uploadedFiles[0] || null,
        back_image: state.uploadedFiles[1] || null,
        barcode_image: state.uploadedFiles[2] || null,
        matrix_image: state.uploadedFiles[3] || null,
        barcode_number: analysisResult?.analysis?.barcode || null,
        artist: bestArtist,
        title: bestTitle,
        label: analysisResult?.analysis?.label || searchResults[0]?.label || null,
        catalog_number: analysisResult?.analysis?.catalog_number || searchResults[0]?.catalog_number || null,
        year: analysisResult?.analysis?.year || searchResults[0]?.year || null,
        format: 'CD',
        genre: analysisResult?.analysis?.genre || searchResults[0]?.genre || null,
        country: analysisResult?.analysis?.country || searchResults[0]?.country || null,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url) || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null,
        user_id: user?.id
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
    if ((!analysisResult?.analysis && !state.discogsIdMode) || !state.mediaType) return;

    const artist = state.discogsIdMode 
      ? searchResults[0]?.artist || 'Unknown'
      : analysisResult?.analysis?.artist || '';
    const title = state.discogsIdMode 
      ? searchResults[0]?.title || 'Unknown'
      : analysisResult?.analysis?.title || '';
    const catalog_number = state.discogsIdMode
      ? searchResults[0]?.catalog_number || ''
      : analysisResult?.analysis?.catalog_number || '';

    const duplicates = await checkForDuplicates(artist, title, catalog_number);
    
    if (duplicates.length > 0) {
      dispatch({ type: 'SET_DUPLICATE_RECORDS', payload: duplicates });
      dispatch({ type: 'SET_PENDING_SAVE_DATA', payload: { condition, advicePrice } });
      dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: true });
      return;
    }

    await performSave(condition, advicePrice);
  }, [analysisResult, state.mediaType, state.discogsIdMode, searchResults, checkForDuplicates, performSave]);

  const handleMediaTypeSelect = useCallback((type: 'vinyl' | 'cd') => {
    dispatch({ type: 'SET_MEDIA_TYPE', payload: type });
  }, []);

  const handleDiscogsIdSelect = useCallback(() => {
    dispatch({ type: 'SET_DISCOGS_ID_MODE', payload: true });
  }, []);

  const handleDiscogsIdSubmit = useCallback(async (discogsId: string, mediaType: 'vinyl' | 'cd') => {
    dispatch({ type: 'SET_DIRECT_DISCOGS_ID', payload: discogsId });
    dispatch({ type: 'SET_MEDIA_TYPE', payload: mediaType });
    console.log('🆔 Starting Discogs ID search for:', discogsId, 'mediaType:', mediaType);
    
    await searchByDiscogsId(discogsId);
  }, [searchByDiscogsId]);

  const handleFileUploaded = useCallback((url: string) => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [...state.uploadedFiles, url] });
  }, [state.uploadedFiles]);

  const handleConditionChange = useCallback((condition: string) => {
    console.log('🔄 handleConditionChange called with condition:', condition);
    console.log('🔄 Current state.discogsIdMode:', state.discogsIdMode);
    console.log('🔄 Available searchResults:', searchResults);
    console.log('🔄 Current selectedCondition:', state.selectedCondition);
    console.log('🔄 Current calculatedAdvicePrice:', state.calculatedAdvicePrice);
    
    dispatch({ type: 'SET_SELECTED_CONDITION', payload: condition });
    
    const lowestPrice = searchResults[0]?.pricing_stats?.lowest_price;
    console.log('🔄 Lowest price found:', lowestPrice);
    
    if (lowestPrice) {
      const advicePrice = calculateAdvicePrice(condition, lowestPrice);
      console.log('🔄 Calculated advice price:', advicePrice);
      if (advicePrice) {
        console.log('💰 Setting calculated advice price:', advicePrice);
        dispatch({ type: 'SET_CALCULATED_ADVICE_PRICE', payload: advicePrice });
      }
    } else {
      console.log('❌ No lowest price found, cannot calculate advice price');
    }
  }, [searchResults, calculateAdvicePrice, state.discogsIdMode, state.selectedCondition, state.calculatedAdvicePrice]);

  const handleSave = useCallback(async () => {
    const finalAdvicePrice = state.useManualAdvicePrice ? state.manualAdvicePrice : state.calculatedAdvicePrice;
    console.log('💾 handleSave called with condition:', state.selectedCondition, 'advicePrice:', finalAdvicePrice);
    if (!state.selectedCondition || !finalAdvicePrice) {
      toast({
        title: "Kan niet opslaan",
        description: "Selecteer eerst een conditie en zorg dat prijsscan compleet is",
        variant: "destructive"
      });
      return;
    }
    
    await saveFinalScan(state.selectedCondition, finalAdvicePrice);
  }, [state.selectedCondition, state.calculatedAdvicePrice, state.manualAdvicePrice, state.useManualAdvicePrice, saveFinalScan]);

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
    resetSearchState();
  }, [resetSearchState, setVinylAnalysisResult, setCDAnalysisResult]);

  const handleManualAdvicePriceChange = useCallback((price: number) => {
    dispatch({ type: 'SET_MANUAL_ADVICE_PRICE', payload: price });
  }, []);

  const handleToggleManualAdvicePrice = useCallback((useManual: boolean) => {
    dispatch({ type: 'SET_USE_MANUAL_ADVICE_PRICE', payload: useManual });
  }, []);

  const steps = [
    { id: 0, title: "Media Type", description: "Wat ga je scannen?", active: !state.mediaType && !state.discogsIdMode },
    { id: 1, title: "Foto's", description: "Upload je foto's", active: state.mediaType && !state.discogsIdMode && state.uploadedFiles.length === 0 },
    { id: 2, title: "Analyseren", description: "AI analyseert", active: isAnalyzing },
    { id: 3, title: "Zoeken", description: "Discogs zoeken", active: isSearching },
    { id: 4, title: "Prijzen", description: "Prijzen berekenen", active: searchResults.length > 0 && !state.selectedCondition },
    { id: 5, title: "Voltooid", description: "Scan opslaan", active: state.selectedCondition && state.calculatedAdvicePrice }
  ];

  return (
    <div className="min-h-screen bg-gradient-scan">
      <Navigation />

      {!state.mediaType && !state.discogsIdMode && (
        <HeroSection />
      )}

      <main className="container mx-auto px-4 py-8">
        {(state.mediaType || state.discogsIdMode) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Scan Progress</h2>
              <span className="text-sm text-muted-foreground">
                Stap {state.currentStep + 1} van {steps.length}
              </span>
            </div>
            <Progress value={(state.currentStep / (steps.length - 1)) * 100} className="w-full" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {steps.map((step) => (
                <span key={step.id} className={step.active ? "text-primary font-medium" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          {!state.mediaType && !state.discogsIdMode && (
            <MediaTypeSelector
              onSelectMediaType={handleMediaTypeSelect}
              onSelectDiscogsId={handleDiscogsIdSelect}
            />
          )}

          {state.discogsIdMode && !state.directDiscogsId && (
            <DiscogsIdInput
              onSubmit={handleDiscogsIdSubmit}
              isSearching={isSearching}
            />
          )}

          {state.mediaType && !state.discogsIdMode && state.uploadedFiles.length === 0 && (
            <UploadSection
              mediaType={state.mediaType}
              uploadedFiles={state.uploadedFiles}
              onFileUploaded={handleFileUploaded}
              isAnalyzing={isAnalyzing}
            />
          )}

          {isAnalyzing && (
            <SearchingLoadingCard />
          )}

          {isSearching && (
            <SearchingLoadingCard />
          )}

          {searchResults.length > 0 && (
            <ScanResults
              searchResults={searchResults}
              searchStrategies={searchStrategies}
              analysisResult={analysisResult}
              mediaType={state.mediaType}
              onCopyToClipboard={copyToClipboard}
              onRetryPricing={() => retryPricing(searchResults[0]?.discogs_id)}
              isPricingRetrying={isPricingRetrying}
            />
          )}

          {state.currentStep >= 2 && !isSearching && !isAnalyzing && searchResults.length === 0 && analysisResult && (
            <ManualSearch
              mediaType={state.mediaType}
              analysisResult={analysisResult}
              onResultsFound={setSearchResults}
            />
          )}

          {state.currentStep >= 2 && !isAnalyzing && !isSearching && !analysisResult && searchResults.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Er ging iets mis tijdens de analyse. Probeer het opnieuw of reset de scan.
                <div className="mt-2">
                  <Button variant="outline" onClick={resetScan} size="sm">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset Scan
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {state.completedScanData && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Scan Succesvol Voltooid!
                </CardTitle>
                <CardDescription>
                  Je {state.mediaType === 'vinyl' ? 'LP' : 'CD'} is opgeslagen in je collectie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Artiest:</strong> {state.completedScanData.artist}</p>
                    <p><strong>Titel:</strong> {state.completedScanData.title}</p>
                    <p><strong>Conditie:</strong> {state.completedScanData.condition_grade}</p>
                  </div>
                  <div>
                    <p><strong>Adviesprijs:</strong> €{state.completedScanData.calculated_advice_price?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Format:</strong> {state.completedScanData.format}</p>
                    <p><strong>Jaar:</strong> {state.completedScanData.year || 'Onbekend'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={resetScan} className="flex-1">
                    Nieuwe Scan Starten
                  </Button>
                  <Link to="/marketplace-overview" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Bekijk Collectie
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialog open={state.showDuplicateDialog} onOpenChange={() => dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: false })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                Mogelijke Duplicaten Gevonden
              </AlertDialogTitle>
              <AlertDialogDescription>
                We hebben {state.duplicateRecords.length} vergelijkbare record(s) gevonden in je collectie. 
                Wil je toch doorgaan met opslaan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="max-h-60 overflow-y-auto my-4">
              {state.duplicateRecords.map((record: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 mb-2 bg-muted/50">
                  <div className="text-sm">
                    <p><strong>{record.artist}</strong> - {record.title}</p>
                    <p className="text-muted-foreground">
                      {record.format} • {record.year || 'Onbekend jaar'} • {record.condition_grade}
                    </p>
                    {record.catalog_number && (
                      <p className="text-xs text-muted-foreground">Cat: {record.catalog_number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSave}>
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveAnyway}>
                Toch Opslaan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Index;
