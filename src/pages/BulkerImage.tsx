import React, { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, RefreshCcw, BarChart3, Camera, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Disc3, Archive } from 'lucide-react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { DiscogsIdInput } from "@/components/DiscogsIdInput";
import { VinylLoadingCard } from "@/components/VinylLoadingCard";
import { scanReducer, initialScanState } from "@/components/ScanStateReducer";
import { useAuth } from "@/contexts/AuthContext";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const BulkerImage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Check if we're on the /scanner/discogs route
  const isDiscogsRoute = location.pathname === '/scanner/discogs';
  const [state, dispatch] = useReducer(scanReducer, initialScanState);
  const { user } = useAuth();
  const { checkUsageLimit, incrementUsage } = useUsageTracking();
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const [upgradeReason, setUpgradeReason] = React.useState<'usage_limit' | 'feature_limit'>('usage_limit');
  const [usageInfo, setUsageInfo] = React.useState<{current: number, limit: number, plan: string} | undefined>();
  
  // Ref to prevent multiple auto-starts
  const autoStartTriggered = useRef(false);

  // Check if we're coming from AI scan with pre-filled data
  const fromAiScan = searchParams.get('fromAiScan') === 'true';
  const urlMediaType = searchParams.get('mediaType') as 'vinyl' | 'cd' | null;
  const urlDiscogsId = searchParams.get('discogsId');
  const urlArtist = searchParams.get('artist');
  const urlTitle = searchParams.get('title');
  const urlLabel = searchParams.get('label');
  const urlCatalogNumber = searchParams.get('catalogNumber');
  const urlYear = searchParams.get('year');
  const urlCondition = searchParams.get('condition');

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
    isPricingLoading,
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

  // Auto-populate from AI scan URL parameters and auto-start search
  useEffect(() => {
    if (fromAiScan && urlMediaType && urlDiscogsId && !autoStartTriggered.current) {
      console.log('🔗 Auto-populating from AI scan URL parameters');
      console.log('📊 URL Condition:', urlCondition);
      
      // Set media type
      dispatch({ type: 'SET_MEDIA_TYPE', payload: urlMediaType });
      
  // Auto-fill condition if provided
      if (urlCondition) {
        // Normalize condition for better matching
        const decodedCondition = decodeURIComponent(urlCondition);
        console.log('✅ Setting condition from URL:', decodedCondition);
        dispatch({ type: 'SET_SELECTED_CONDITION', payload: decodedCondition });
      } else {
        console.log('⚠️ No condition found in URL parameters');
      }
      
      // Go directly to Discogs ID mode
      dispatch({ type: 'SET_DISCOGS_ID_MODE', payload: true });
      dispatch({ type: 'SET_DIRECT_DISCOGS_ID', payload: urlDiscogsId });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
      
      // Auto-start the Discogs search
      autoStartTriggered.current = true;
      
      toast({
        title: "Smart scan herkend",
        description: `${urlArtist} - ${urlTitle} wordt automatisch gezocht${urlCondition ? ' met conditie ingevuld' : ''}...`,
        variant: "default"
      });
      
      // Trigger the search after a short delay
      setTimeout(() => {
        searchByDiscogsId(urlDiscogsId);
      }, 1000);
    }
  }, [fromAiScan, urlMediaType, urlDiscogsId, urlCondition, urlArtist, urlTitle, searchByDiscogsId, isDiscogsRoute]);

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
    if (analysisResult?.analysis && !isSearching && searchResults.length === 0) {
      const { artist, title, catalog_number } = analysisResult.analysis;
      
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
  }, [analysisResult?.analysis, isSearching, searchResults.length, searchCatalog]);

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

  // Auto-calculate advice price when condition and pricing are available
  useEffect(() => {
    if (
      state.selectedCondition && 
      searchResults[0]?.pricing_stats?.lowest_price && 
      !state.calculatedAdvicePrice &&
      !state.useManualAdvicePrice
    ) {
      console.log('🎯 Auto-calculating advice price for condition:', state.selectedCondition);
      const advicePrice = calculateAdvicePrice(state.selectedCondition, searchResults[0].pricing_stats.lowest_price);
      if (advicePrice !== null) {
        dispatch({ type: 'SET_CALCULATED_ADVICE_PRICE', payload: advicePrice });
        console.log('💰 Auto-set advice price:', advicePrice);
      }
    }
  }, [state.selectedCondition, searchResults, state.calculatedAdvicePrice, state.useManualAdvicePrice, calculateAdvicePrice]);

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
    
    // Check bulk upload usage limit
    try {
      const usageCheck = await checkUsageLimit('bulk_uploads');
      if (!usageCheck.can_use) {
        setUsageInfo({
          current: usageCheck.current_usage,
          limit: usageCheck.limit_amount || 0,
          plan: usageCheck.plan_name
        });
        setUpgradeReason('usage_limit');
        setShowUpgradePrompt(true);
        return;
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error);
      toast({
        title: "Fout bij Controle",
        description: "Kon gebruikslimiet niet controleren. Probeer het opnieuw.",
        variant: "destructive"
      });
      return;
    }
    
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
      
      const bestArtist = getBestData(searchResults[0]?.artist, analysisResult?.analysis?.artist);
      const bestTitle = getBestData(searchResults[0]?.title, analysisResult?.analysis?.title);
      
      console.log('💾 Saving with artist:', bestArtist, 'title:', bestTitle);
      
      // Derive best-available metadata (prefer Discogs > OCR)
      const bestCatalogNumber = getBestData(searchResults[0]?.catalog_number, analysisResult?.analysis?.catalog_number);
      const bestLabel = getBestData(searchResults[0]?.label, analysisResult?.analysis?.label);
      const bestGenre = getBestData(searchResults[0]?.genre, analysisResult?.analysis?.genre);
      const bestCountry = getBestData(searchResults[0]?.country, analysisResult?.analysis?.country);
      const bestFormat = state.mediaType === 'vinyl' ? 'Vinyl' : 'CD';
      const bestYearStr = getBestData(
        (searchResults[0]?.year != null ? String(searchResults[0]?.year) : undefined),
        analysisResult?.analysis?.year ? String(analysisResult?.analysis?.year) : undefined
      );
      const bestYear = bestYearStr ? parseInt(bestYearStr) : null;
      const bestMatrixNumber = analysisResult?.analysis?.matrix_number;

      console.log('🧾 Best data prepared', { bestArtist, bestTitle, bestCatalogNumber, bestYear, bestLabel, bestGenre, bestCountry });

      const insertData = state.mediaType === 'vinyl' ? {
        catalog_image: state.uploadedFiles[0] || null,
        matrix_image: state.uploadedFiles[1] || null,
        additional_image: state.uploadedFiles[2] || null,
        catalog_number: bestCatalogNumber ?? null,
        matrix_number: bestMatrixNumber ?? null,
        artist: bestArtist ?? null,
        title: bestTitle ?? null,
        year: bestYear,
        format: bestFormat,
        label: bestLabel ?? null,
        genre: bestGenre ?? null,
        country: bestCountry ?? null,
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
        barcode_number: analysisResult?.analysis?.barcode ?? null,
        artist: bestArtist ?? null,
        title: bestTitle ?? null,
        label: bestLabel ?? null,
        catalog_number: bestCatalogNumber ?? null,
        year: bestYear,
        format: bestFormat,
        genre: bestGenre ?? null,
        country: bestCountry ?? null,
        condition_grade: condition,
        calculated_advice_price: advicePrice,
        discogs_id: searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url) || null,
        discogs_url: searchResults[0]?.discogs_url || null,
        lowest_price: searchResults[0]?.pricing_stats?.lowest_price ? parseFloat(searchResults[0].pricing_stats.lowest_price.replace(',', '.')) : null,
        median_price: searchResults[0]?.pricing_stats?.median_price ? parseFloat(searchResults[0].pricing_stats.median_price.replace(',', '.')) : null,
        highest_price: searchResults[0]?.pricing_stats?.highest_price ? parseFloat(searchResults[0].pricing_stats.highest_price.replace(',', '.')) : null,
        user_id: user?.id
      };

      console.log('📦 Insert payload (keys only):', Object.keys(insertData));

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_COMPLETED_SCAN_DATA', payload: data });
      
      // Increment usage after successful save
      try {
        await incrementUsage('bulk_uploads', 1);
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }
      
      toast({
        title: "Scan Voltooid! ✅",
        description: `${state.mediaType === 'vinyl' ? 'LP' : 'CD'} opgeslagen met adviesprijs: €${advicePrice.toFixed(2)}`,
        variant: "default"
      });
    } catch (error) {
      console.error('❌ Error inserting scan:', error);
      toast({
        title: "Fout bij Opslaan",
        description: error?.message ?? "Kon scan niet opslaan in database",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_IS_SAVING_CONDITION', payload: false });
    }
  }, [analysisResult, state.mediaType, state.uploadedFiles, searchResults]);

  const saveFinalScan = useCallback(async (condition: string, advicePrice: number) => {
    console.log('🚀 saveFinalScan called with condition:', condition, 'advicePrice:', advicePrice);
    // Allow save when either we have analysis OR we are in Discogs-ID modus
    if ((!analysisResult?.analysis && !state.discogsIdMode) || !state.mediaType) {
      console.log('⛔ saveFinalScan guard failed', {
        hasAnalysis: !!analysisResult?.analysis,
        discogsIdMode: state.discogsIdMode,
        mediaType: state.mediaType,
      });
      return;
    }

    // Use best-available data (Discogs > OCR) for duplicate check
    const getBestData = (discogsValue?: string, ocrValue?: string) => {
      const cleanDiscogs = discogsValue?.trim();
      const cleanOcr = ocrValue?.trim();
      if (cleanDiscogs && cleanDiscogs !== '' && cleanDiscogs.toLowerCase() !== 'unknown') return cleanDiscogs;
      return cleanOcr || '';
    };

    const artist = getBestData(searchResults[0]?.artist, analysisResult?.analysis?.artist);
    const title = getBestData(searchResults[0]?.title, analysisResult?.analysis?.title);
    const catalog_number = getBestData(searchResults[0]?.catalog_number, analysisResult?.analysis?.catalog_number);

    console.log('🔎 Duplicate check with:', { artist, title, catalog_number });
    const duplicates = await checkForDuplicates(artist, title, catalog_number);
    
    if (duplicates.length > 0) {
      dispatch({ type: 'SET_DUPLICATE_RECORDS', payload: duplicates });
      dispatch({ type: 'SET_PENDING_SAVE_DATA', payload: { condition, advicePrice } });
      dispatch({ type: 'SET_SHOW_DUPLICATE_DIALOG', payload: true });
      return;
    }

    await performSave(condition, advicePrice);
  }, [analysisResult, state.mediaType, state.discogsIdMode, searchResults, checkForDuplicates, performSave]);

  // Event handlers
  const handleMediaTypeSelect = useCallback((type: 'vinyl' | 'cd') => {
    dispatch({ type: 'SET_MEDIA_TYPE', payload: type });
  }, []);

  const handleDiscogsIdSelect = useCallback(() => {
    dispatch({ type: 'SET_DISCOGS_ID_MODE', payload: true });
  }, []);

  const handleDiscogsIdSubmit = useCallback(async (discogsId: string, mediaType: 'vinyl' | 'cd') => {
    console.log('🆔 Starting Discogs ID search for:', discogsId, 'mediaType:', mediaType);
    
    // Set the media type first
    dispatch({ type: 'SET_MEDIA_TYPE', payload: mediaType });
    dispatch({ type: 'SET_DIRECT_DISCOGS_ID', payload: discogsId });
    
    try {
      await searchByDiscogsId(discogsId);
      
      toast({
        title: "Discogs ID Zoeken Gestart",
        description: `Zoeken naar ${mediaType === 'vinyl' ? 'LP' : 'CD'} met ID: ${discogsId}`,
        variant: "default"
      });
    } catch (error) {
      console.error('❌ Discogs ID search failed:', error);
      toast({
        title: "Zoeken Mislukt",
        description: "Er is een fout opgetreden bij het zoeken",
        variant: "destructive"
      });
    }
  }, [searchByDiscogsId]);

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
    setSearchResults([]);
    resetSearchState();
    clearCache();
  }, [setVinylAnalysisResult, setCDAnalysisResult, setSearchResults, resetSearchState, clearCache]);

  const retrySearchWithPricing = useCallback(async () => {
    if (!analysisResult?.analysis?.catalog_number) return;
    
    const { artist, title, catalog_number } = analysisResult.analysis;
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
            {fromAiScan && (
              <Link to="/ai-scan-v2">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug naar AI-scan
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {fromAiScan ? 'Toevoegen aan Collectie' : 'Image Scan'}
              </h1>
              {fromAiScan && (
                <p className="text-sm text-muted-foreground mt-1">
                  Data uit AI-scan vooringevuld - selecteer alleen conditie
                </p>
              )}
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

        {/* Media Type Selection - Skip if coming from AI scan */}
        {!state.mediaType && !state.discogsIdMode && !fromAiScan && (
          <div className="mb-8">
            <MediaTypeSelector 
              onSelectMediaType={handleMediaTypeSelect}
              onSelectDiscogsId={handleDiscogsIdSelect}
            />
          </div>
        )}

        {/* Discogs ID Input */}
        {state.discogsIdMode && !searchResults.length && !isSearching && (
          <div className="mb-8">
            <DiscogsIdInput 
              onSubmit={handleDiscogsIdSubmit}
              isSearching={isSearching}
              prefilledDiscogsId={state.directDiscogsId || undefined}
              prefilledMediaType={state.mediaType || undefined}
            />
          </div>
        )}

        {/* Upload Section - Skip if coming from AI scan */}
        {state.mediaType && !state.discogsIdMode && !fromAiScan && (
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

        {isSearching && <VinylLoadingCard />}

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
          <div className="mb-8 space-y-4">
            <Card className="border-blue-200 bg-blue-50">
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
            
            {/* Manual Search Component */}
            <ManualSearch 
              analysisResult={analysisResult}
              onResultsFound={setSearchResults}
              mediaType={state.mediaType!}
            />
          </div>
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
              isPricingLoading={isPricingLoading}
            />
          </div>
        )}

        {/* Condition Selector - Only show when Discogs search is complete AND has pricing */}
        {!isAnalyzing && !isSearching && searchResults.length > 0 && searchResults[0]?.pricing_stats?.lowest_price && (state.discogsIdMode || analysisResult) && (
          <div className="mb-8">
            <ConditionSelector
              mediaType={state.mediaType!}
              selectedCondition={state.selectedCondition}
              lowestPrice={searchResults[0]?.pricing_stats?.lowest_price}
              medianPrice={searchResults[0]?.pricing_stats?.median_price}
              highestPrice={searchResults[0]?.pricing_stats?.highest_price}
              calculatedAdvicePrice={state.calculatedAdvicePrice}
              manualAdvicePrice={state.manualAdvicePrice}
              useManualAdvicePrice={state.useManualAdvicePrice}
              isSaving={state.isSavingCondition}
              onConditionChange={handleConditionChange}
              onManualAdvicePriceChange={(price) => dispatch({ type: 'SET_MANUAL_ADVICE_PRICE', payload: price })}
              onToggleManualAdvicePrice={(useManual) => dispatch({ type: 'SET_USE_MANUAL_ADVICE_PRICE', payload: useManual })}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Loading indicator specifically for condition selector availability */}
        {analysisResult && searchResults.length > 0 && (isAnalyzing || isSearching) && (
          <Card className="w-full max-w-4xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-lg font-medium">Voltooien van analyse...</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                De OPSLAAN knop wordt beschikbaar zodra alle gegevens zijn verwerkt.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Warning if search results exist but no pricing data */}
        {!isAnalyzing && !isSearching && searchResults.length > 0 && !searchResults[0]?.pricing_stats?.lowest_price && (
          <Card className="w-full max-w-4xl mb-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Geen prijsgegevens beschikbaar</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Er zijn zoekresultaten gevonden, maar geen prijsinformatie. Probeer opnieuw te zoeken of controleer de gegevens.
                  </p>
                  <Button 
                    onClick={retrySearchWithPricing}
                    variant="outline"
                    size="sm"
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 mt-3"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Opnieuw Zoeken
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
        
        {/* Upgrade Prompt */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          reason={upgradeReason}
          currentPlan={usageInfo?.plan || 'free'}
          usageInfo={usageInfo}
        />
      </div>
    </div>
  );
};

export default BulkerImage;
