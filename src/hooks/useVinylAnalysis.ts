import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWakeLock } from '@/hooks/useWakeLock';
import { preprocessImagesClient, ClientPreprocessResult } from '@/utils/clientImagePreprocess';

// Check if input is a File object
const isFile = (input: any): input is File => {
  return input instanceof File;
};

export interface PreprocessingState {
  isPreprocessing: boolean;
  progress: number;
  currentImage: number;
  totalImages: number;
  previews: ClientPreprocessResult[];
}

export const useVinylAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [preprocessState, setPreprocessState] = useState<PreprocessingState>({
    isPreprocessing: false,
    progress: 0,
    currentImage: 0,
    totalImages: 0,
    previews: [],
  });
  const wakeLock = useWakeLock();

  // Show warning when leaving page during analysis
  useEffect(() => {
    if (!isAnalyzing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Analyse is nog bezig. Weet je zeker dat je wilt verlaten?';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isAnalyzing) {
        console.log('⚠️ Page hidden during analysis - wake lock should keep process alive');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAnalyzing]);

  /**
   * Client-side preprocessing for quick preview feedback
   * Returns preprocessed images ready for server analysis
   */
  const preprocessImages = useCallback(async (imageInputs: (string | File)[]): Promise<ClientPreprocessResult[] | null> => {
    if (imageInputs.length === 0) return null;
    
    setPreprocessState({
      isPreprocessing: true,
      progress: 0,
      currentImage: 0,
      totalImages: imageInputs.length,
      previews: [],
    });

    try {
      console.log('📸 Starting client-side preprocessing...');
      
      const { results, totalTimeMs } = await preprocessImagesClient(imageInputs, {
        maxDimension: 1600,
        applyContrast: true,
        quality: 0.85,
      });

      setPreprocessState(prev => ({
        ...prev,
        isPreprocessing: false,
        progress: 100,
        previews: results,
      }));

      console.log(`✅ Client preprocessing complete: ${results.length} images in ${totalTimeMs.toFixed(0)}ms`);
      
      return results;
    } catch (error) {
      console.error('❌ Client preprocessing error:', error);
      setPreprocessState(prev => ({
        ...prev,
        isPreprocessing: false,
        progress: 0,
      }));
      return null;
    }
  }, []);

  const analyzeImages = async (imageInputs: (string | File)[]) => {
    if (imageInputs.length !== 3) {
      toast({
        title: "Error",
        description: "Alle 3 foto's zijn nodig voor analyse",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    
    // Request wake lock to keep screen on during analysis
    await wakeLock.request();
    
    try {
      // STEP 1: Client-side preprocessing (fast, <500ms)
      console.log('📸 Step 1: Client-side preprocessing...');
      const preprocessed = await preprocessImages(imageInputs);
      
      // Use preprocessed images if available, otherwise convert directly
      let imageUrls: string[];
      if (preprocessed) {
        imageUrls = preprocessed.map(p => p.processedImage);
        console.log('📸 Using client-preprocessed images');
      } else {
        // Fallback: convert Files to base64 directly
        imageUrls = await Promise.all(
          imageInputs.map(async (input) => {
            if (isFile(input)) {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(input);
              });
            }
            return input;
          })
        );
      }
      
      console.log('📸 Images ready:', imageUrls.length, 'images');
      
      // STEP 2: Server-side heavy processing (OCR, stacking, Discogs matching)
      console.log('🔍 Step 2: Server-side analysis...');
      
      // Mobile-optimized timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ANALYSIS_TIMEOUT = isMobile ? 30000 : 50000;
      
      const analysisPromise = supabase.functions.invoke('analyze-vinyl-images', {
        body: {
          imageUrls: imageUrls,
          scanId: Date.now().toString(),
          enableCaching: true,
          parallelProcessing: true,
          // Include preprocessing stats for server
          clientPreprocessed: !!preprocessed,
          preprocessStats: preprocessed ? {
            totalImages: preprocessed.length,
            avgProcessingTime: preprocessed.reduce((sum, p) => sum + p.stats.processingTimeMs, 0) / preprocessed.length,
          } : null,
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout - process took too long')), ANALYSIS_TIMEOUT);
      });

      const result = await Promise.race([analysisPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        throw error;
      }

      console.log('📦 Vinyl Analysis raw data:', JSON.stringify(data));

      const analysis = {
        artist: data.artist || null,
        title: data.title || null,
        label: data.label || null,
        catalog_number: data.catalog_number || null,
        barcode: data.barcode || null,
        year: data.year || null,
        format: data.format || 'Vinyl',
        genre: data.genre || null,
        country: data.country || null,
        matrix_number: data.matrix_number || null,
        confidence: data.confidence || null,
        ocr_notes: data.ocr_notes || null,
        raw_spelling: data.raw_spelling || null,
      };

      // Include enhanced images from preprocessing for comparison UI
      const enhancedImageData = preprocessed && preprocessed.length > 0 ? {
        enhanced_image: preprocessed[0].processedImage,
        original_image: preprocessed[0].originalImage,
        processing_stats: {
          enhancementFactor: 1.2, // Light client enhancement
          clientProcessingMs: preprocessed[0].stats.processingTimeMs,
          wasResized: preprocessed[0].stats.wasResized,
        },
      } : {};

      const transformedData = {
        analysis: {
          ...analysis,
          ...enhancedImageData,
        },
        discogsData: {
          discogs_id: data.discogs_id || null,
          discogs_url: data.discogs_url || null,
          cover_image: data.cover_image || null,
        },
        success: true
      };

      console.log('📦 Transformed data:', JSON.stringify(transformedData));
      setAnalysisResult(transformedData);
      
      const confidenceInfo = data.confidence?.verified === false ? ' ⚠️ Niet zeker' : '';
      toast({
        title: "OCR Analyse Voltooid! 🎉",
        description: `Gevonden: ${analysis.artist || 'Onbekend'} - ${analysis.title || 'Onbekend'}${confidenceInfo}`,
        variant: "default"
      });

      return transformedData;
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      setAnalysisResult(null);
      
      const isTimeout = error.message?.includes('timeout');
      const errorMessage = isTimeout 
        ? "Analyse duurde te lang. Probeer opnieuw of controleer je internetverbinding."
        : error.message || "Er is een fout opgetreden tijdens de OCR analyse";

      toast({
        title: isTimeout ? "Analyse Timeout" : "Analyse Mislukt",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      await wakeLock.release();
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeImages,
    setAnalysisResult,
    // Expose preprocessing state for UI feedback
    preprocessState,
    preprocessImages,
  };
};