import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MediaTypeSelector } from '@/components/MediaTypeSelector';
import { UploadSection } from '@/components/UploadSection';
import { SearchingLoadingCard } from '@/components/SearchingLoadingCard';
import { ScanResults } from '@/components/ScanResults';
import { ConditionSelector } from '@/components/ConditionSelector';
import { ManualSearch } from '@/components/ManualSearch';
import { DiscogsIdInput } from '@/components/DiscogsIdInput';
import { useVinylAnalysis } from '@/hooks/useVinylAnalysis';
import { useCDAnalysis } from '@/hooks/useCDAnalysis';
import { useDiscogsSearch } from '@/hooks/useDiscogsSearch';
import { scanReducer, initialScanState } from '@/components/ScanStateReducer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuickPriceCheck() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(scanReducer, initialScanState);

  const { isAnalyzing: isAnalyzingVinyl, analysisResult: vinylResult, analyzeImages: analyzeVinylImages } = useVinylAnalysis();
  const { isAnalyzing: isAnalyzingCD, analysisResult: cdResult, analyzeImages: analyzeCDImages } = useCDAnalysis();
  const { 
    searchResults, 
    isSearching, 
    searchStrategies, 
    searchCatalog,
    searchByDiscogsId,
    retryPricing,
    isPricingLoading
  } = useDiscogsSearch();

  const isAnalyzing = isAnalyzingVinyl || isAnalyzingCD;
  const analysisResult = useMemo(() => 
    state.mediaType === 'vinyl' ? vinylResult : (state.mediaType === 'cd' ? cdResult : null),
    [state.mediaType, vinylResult, cdResult]
  );

  useEffect(() => {
    const mediaTypeParam = searchParams.get('mediaType');
    if (mediaTypeParam === 'vinyl' || mediaTypeParam === 'cd') {
      dispatch({ type: 'SET_MEDIA_TYPE', payload: mediaTypeParam });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
    }

    const discogsIdParam = searchParams.get('discogsId');
    if (discogsIdParam) {
      const discogsId = parseInt(discogsIdParam);
      if (!isNaN(discogsId)) {
        dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
        searchByDiscogsId(discogsIdParam);
      }
    }
  }, [searchParams, searchByDiscogsId]);

  const handleMediaTypeSelect = useCallback((type: 'vinyl' | 'cd') => {
    dispatch({ type: 'SET_MEDIA_TYPE', payload: type });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [] });
  }, []);

  const handleFileUploaded = useCallback((fileUrl: string) => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [...state.uploadedFiles, fileUrl] });
  }, [state.uploadedFiles]);

  const handleDiscogsIdSubmit = useCallback((discogsId: string) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
    searchByDiscogsId(discogsId);
  }, [searchByDiscogsId]);

  useEffect(() => {
    const requiredPhotos = state.mediaType === 'vinyl' ? 3 : 4;
    
    if (state.uploadedFiles.length === requiredPhotos && state.currentStep === 1) {
      const analyzePhotos = async () => {
        dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
        
        let result;
        if (state.mediaType === 'vinyl') {
          result = await analyzeVinylImages(state.uploadedFiles);
        } else {
          result = await analyzeCDImages(state.uploadedFiles);
        }

        if (result?.analysis) {
          dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
          
          const catalogNumber = result.analysis.catalog_number || result.analysis.catalogNumber;
          const artist = result.analysis.artist;
          const title = result.analysis.title;
          
          await searchCatalog(catalogNumber, artist, title, true);
          dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
        } else {
          dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
        }
      };

      analyzePhotos();
    }
  }, [state.uploadedFiles, state.mediaType, state.currentStep, analyzeVinylImages, analyzeCDImages, searchCatalog]);

  const handleResultsFound = useCallback(async (results: any[]) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
  }, []);

  const handleNewCheck = useCallback(() => {
    dispatch({ type: 'RESET_SCAN' });
    navigate('/quick-price-check');
  }, [navigate]);

  const handleCopyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Snelle Prijscheck
            </h1>
            <Badge variant="outline" className="text-sm">
              Niet opgeslagen
            </Badge>
          </div>
          <Alert className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Deze prijscheck wordt niet opgeslagen in je collectie. Perfect voor een snelle waardecheck!
            </AlertDescription>
          </Alert>
        </div>

        {state.currentStep === 0 && (
          <MediaTypeSelector 
            onSelectMediaType={handleMediaTypeSelect}
            onSelectDiscogsId={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 5 })}
          />
        )}

        {state.currentStep === 5 && (
          <DiscogsIdInput onSubmit={handleDiscogsIdSubmit} />
        )}

        {state.currentStep === 1 && state.mediaType && (
          <>
            <UploadSection
              mediaType={state.mediaType}
              uploadedFiles={state.uploadedFiles}
              onFileUploaded={handleFileUploaded}
              isAnalyzing={isAnalyzing}
            />
            <ManualSearch
              analysisResult={analysisResult}
              onResultsFound={handleResultsFound}
              mediaType={state.mediaType}
            />
          </>
        )}

        {state.currentStep === 2 && (
          <SearchingLoadingCard stage="searching" />
        )}

        {state.currentStep === 3 && (
          <SearchingLoadingCard stage="pricing" />
        )}

        {state.currentStep === 4 && state.mediaType && (
          <div className="space-y-6">
            <ScanResults
              analysisResult={analysisResult}
              searchResults={searchResults}
              searchStrategies={searchStrategies}
              mediaType={state.mediaType}
              onCopyToClipboard={handleCopyToClipboard}
              onRetryPricing={() => searchResults[0]?.discogs_id && retryPricing(searchResults[0].discogs_id)}
              isPricingRetrying={isPricingLoading}
              isPricingLoading={isPricingLoading}
            />

            {searchResults && searchResults.length > 0 && (
              <ConditionSelector
                mediaType={state.mediaType}
                selectedCondition={state.selectedCondition}
                onConditionChange={(condition) => dispatch({ type: 'SET_SELECTED_CONDITION', payload: condition })}
                lowestPrice={searchResults[0]?.pricing_stats?.lowest_price || null}
                medianPrice={searchResults[0]?.pricing_stats?.median_price || null}
                highestPrice={searchResults[0]?.pricing_stats?.highest_price || null}
                calculatedAdvicePrice={state.calculatedAdvicePrice}
                manualAdvicePrice={state.manualAdvicePrice}
                onManualAdvicePriceChange={(price) => dispatch({ type: 'SET_MANUAL_ADVICE_PRICE', payload: price })}
                useManualAdvicePrice={state.useManualAdvicePrice}
                onToggleManualAdvicePrice={(use) => dispatch({ type: 'SET_USE_MANUAL_ADVICE_PRICE', payload: use })}
                onSave={() => {}}
                isSaving={false}
              />
            )}

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={handleNewCheck}
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Nieuwe Prijscheck
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
