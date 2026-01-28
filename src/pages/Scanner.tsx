import React, { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, AlertTriangle, RefreshCcw, BarChart3, Camera, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Disc3, Store, LogOut } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { UpgradePrompt } from "@/components/UpgradePrompt";

import { Navigation } from "@/components/Navigation";

const Scanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(scanReducer, initialScanState);
  const { user, signOut } = useAuth();
  const { checkUsageLimit, incrementUsage } = useUsageTracking();
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const [upgradeReason, setUpgradeReason] = React.useState<'usage_limit' | 'feature_limit'>('usage_limit');
  const [usageInfo, setUsageInfo] = React.useState<{current: number, limit: number, plan: string} | undefined>();
  
  // Ref to prevent multiple auto-starts
  const autoStartTriggered = useRef(false);
  
  // Extract URL parameters
  const fromAiScan = searchParams.get('fromAiScan') === 'true';
  const urlMediaType = searchParams.get('mediaType') as 'vinyl' | 'cd' | null;
  const urlDiscogsId = searchParams.get('discogsId');
  const urlArtist = searchParams.get('artist');
  const urlTitle = searchParams.get('title');
  const urlCondition = searchParams.get('condition');
  const returnTo = searchParams.get('returnTo') as 'collection' | 'shop' | null;
  const quickScanType = searchParams.get('type') as 'vinyl' | 'cd' | null;
  const quickDiscogs = searchParams.get('discogs') === 'true';

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

  // Auto-populate from AI scan URL parameters and auto-start search (for legacy /scanner route)
  useEffect(() => {
    if (fromAiScan && urlMediaType && urlDiscogsId && !autoStartTriggered.current) {
      console.log('🔗 Auto-populating from AI scan URL parameters (legacy route)');
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
  }, [fromAiScan, urlMediaType, urlDiscogsId, urlCondition, urlArtist, urlTitle, searchByDiscogsId]);

  // Handle quick scan from QuickScanOptions (new flow)
  useEffect(() => {
    if (quickScanType && !autoStartTriggered.current && !fromAiScan) {
      console.log('🔗 Quick scan flow detected:', quickScanType, 'returnTo:', returnTo);
      
      // Set media type and go to step 1 (upload)
      dispatch({ type: 'SET_MEDIA_TYPE', payload: quickScanType });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
      
      autoStartTriggered.current = true;
      
      toast({
        title: "Scan gestart",
        description: `${quickScanType === 'vinyl' ? 'Vinyl' : 'CD'} scan voorbereid. Upload je foto's om te beginnen.`,
        variant: "default"
      });
    }
  }, [quickScanType, returnTo, fromAiScan]);

  // Handle quick Discogs ID from QuickScanOptions (new flow)
  useEffect(() => {
    if (quickDiscogs && !autoStartTriggered.current && !fromAiScan) {
      console.log('🔗 Quick Discogs ID flow detected, returnTo:', returnTo);
      
      // Go directly to Discogs ID input mode
      dispatch({ type: 'SET_DISCOGS_ID_MODE', payload: true });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
      
      autoStartTriggered.current = true;
      
      toast({
        title: "Discogs ID mode",
        description: "Voer je Discogs ID in voor een snelle prijscheck.",
        variant: "default"
      });
    }
  }, [quickDiscogs, returnTo, fromAiScan]);

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
      
      // 🔗 Automatic release linking - connect scan to central releases table
      const discogsId = searchResults[0]?.discogs_id || searchResults[0]?.id || extractDiscogsIdFromUrl(searchResults[0]?.discogs_url);
      if (data && discogsId) {
        try {
          console.log('🔗 Linking to releases table for Discogs ID:', discogsId);
          const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
            body: {
              discogs_id: discogsId,
              artist: bestArtist,
              title: bestTitle,
              label: insertData.label,
              catalog_number: insertData.catalog_number,
              year: insertData.year,
              format: state.mediaType === 'vinyl' ? 'Vinyl' : 'CD',
              genre: insertData.genre,
              country: insertData.country,
              discogs_url: searchResults[0]?.discogs_url,
            }
          });

          if (releaseError) {
            console.log('⚠️ Release linking function error:', releaseError);
          } else if (releaseData?.release_id) {
            // Update scan record with release_id
            await supabase.from(tableName)
              .update({ release_id: releaseData.release_id })
              .eq('id', data.id);
            console.log('✅ Linked to release:', releaseData.release_id);
          }
        } catch (linkError) {
          console.log('⚠️ Release linking failed (non-blocking):', linkError);
        }
      }
      
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

      // Handle return navigation based on returnTo parameter
      if (returnTo === 'collection') {
        setTimeout(() => {
          navigate('/my-collection');
        }, 2000);
      } else if (returnTo === 'shop') {
        setTimeout(() => {
          navigate('/my-shop');
        }, 2000);
      }
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
    
    if (!state.selectedCondition) {
      toast({
        title: "Kan niet opslaan",
        description: "Selecteer eerst een conditie",
        variant: "destructive"
      });
      return;
    }
    
    if (!finalAdvicePrice) {
      toast({
        title: "Kan niet opslaan", 
        description: "Voer een prijs in om door te gaan",
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

  const handleManualAdvicePriceChange = useCallback((price: number | null) => {
    dispatch({ type: 'SET_MANUAL_ADVICE_PRICE', payload: price });
  }, []);

  const handleToggleManualAdvicePrice = useCallback((useManual: boolean) => {
    dispatch({ type: 'SET_USE_MANUAL_ADVICE_PRICE', payload: useManual });
    // If switching to manual mode when no calculated price exists, ensure manual mode is active
    if (useManual && !state.calculatedAdvicePrice) {
      dispatch({ type: 'SET_USE_MANUAL_ADVICE_PRICE', payload: true });
    }
  }, [state.calculatedAdvicePrice]);

  const steps = [
    { id: 0, title: "Media Type", description: "Wat ga je scannen?", active: !state.mediaType && !state.discogsIdMode },
    { id: 1, title: "Foto's", description: "Upload je foto's", active: state.mediaType && !state.discogsIdMode && state.uploadedFiles.length === 0 },
    { id: 2, title: "Analyseren", description: "Slim analyseren", active: isAnalyzing },
    { id: 3, title: "Zoeken", description: "Discogs zoeken", active: isSearching },
    { id: 4, title: "Prijzen", description: "Prijzen berekenen", active: searchResults.length > 0 && !state.selectedCondition },
    { id: 5, title: "Voltooid", description: "Scan opslaan", active: state.selectedCondition && (state.calculatedAdvicePrice || state.manualAdvicePrice) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background relative overflow-hidden">
      {/* Musical Background Elements */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-pulse">🎵</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-1000">🎼</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">🎸</div>
        <div className="absolute top-60 left-1/2 text-2xl animate-pulse delay-300">🥁</div>
        <div className="absolute top-80 left-1/4 animate-pulse delay-200">🎺</div>
        <div className="absolute bottom-60 right-1/4 animate-pulse delay-600">🎻</div>
        <div className="absolute top-1/2 right-10 animate-pulse delay-800">🎹</div>
      </div>
      
      {/* Scanner Header with Logout */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
            🎯 Scanner Dashboard
          </h1>
          <Button variant="ghost" onClick={signOut} className="flex items-center gap-2 hover-scale">
            <LogOut className="w-4 h-4" />
            ✨ Uitloggen
          </Button>
        </div>
      </div>

       <main className="container mx-auto px-4 py-8 relative">
        {(state.mediaType || state.discogsIdMode) && (
          <Card className="max-w-4xl mx-auto mb-8 group hover:shadow-xl transition-all duration-300 border-2 hover:border-vinyl-gold/30 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
                  🎶 Scan Voortgang
                </h2>
                <Badge variant="outline" className="text-sm">
                  ✨ Stap {state.currentStep + 1} van {steps.length}
                </Badge>
              </div>
              <Progress value={(state.currentStep / (steps.length - 1)) * 100} className="w-full mb-4" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {steps.map((step) => (
                  <span key={step.id} className={step.active ? "text-vinyl-purple font-medium animate-pulse" : ""}>
                    {step.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="max-w-4xl mx-auto space-y-8 relative">
          {/* Floating Music Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-1/4 animate-pulse delay-200">🎺</div>
            <div className="absolute top-20 right-1/4 animate-pulse delay-600">🎻</div>
            <div className="absolute bottom-20 left-1/3 animate-pulse delay-400">🎹</div>
            <div className="absolute bottom-40 right-1/3 animate-pulse delay-800">🎯</div>
          </div>
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

          {state.mediaType && !state.discogsIdMode && (
            (state.uploadedFiles.length === 0 || 
             (state.mediaType === 'cd' && state.uploadedFiles.length < 4) ||
             (state.mediaType === 'vinyl' && state.uploadedFiles.length < 3)
            ) && !isAnalyzing) && (
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
              isPricingLoading={isPricingLoading}
            />
          )}

          {searchResults.length > 0 && state.mediaType && (
            <ConditionSelector
              mediaType={state.mediaType}
              selectedCondition={state.selectedCondition}
              lowestPrice={searchResults[0]?.pricing_stats?.lowest_price || null}
              medianPrice={searchResults[0]?.pricing_stats?.median_price || null}
              highestPrice={searchResults[0]?.pricing_stats?.highest_price || null}
              calculatedAdvicePrice={state.calculatedAdvicePrice}
              manualAdvicePrice={state.manualAdvicePrice}
              useManualAdvicePrice={state.useManualAdvicePrice}
              isSaving={state.isSavingCondition}
              onConditionChange={handleConditionChange}
              onManualAdvicePriceChange={handleManualAdvicePriceChange}
              onToggleManualAdvicePrice={handleToggleManualAdvicePrice}
              onSave={handleSave}
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
        
        {/* Upgrade Prompt */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          reason={upgradeReason}
          currentPlan={usageInfo?.plan || 'free'}
          usageInfo={usageInfo}
        />
      </main>
    </div>
  );
};

export default Scanner;
