import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWakeLock } from '@/hooks/useWakeLock';

// Convert File to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Check if input is a File object
const isFile = (input: any): input is File => {
  return input instanceof File;
};

// Convert mixed array of Files/URLs to URLs only
const convertToUrls = async (inputs: (string | File)[]): Promise<string[]> => {
  const results = await Promise.all(
    inputs.map(async (input) => {
      if (isFile(input)) {
        // Convert File to base64 data URL
        return await fileToBase64(input);
      }
      // Already a URL string
      return input;
    })
  );
  return results;
};

export const useVinylAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
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
      // Convert Files to base64 data URLs
      console.log('📸 Converting images for analysis...');
      const imageUrls = await convertToUrls(imageInputs);
      console.log('📸 Images ready:', imageUrls.length, 'images');
      
      // Mobile-optimized timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ANALYSIS_TIMEOUT = isMobile ? 30000 : 50000;
      
      const analysisPromise = supabase.functions.invoke('analyze-vinyl-images', {
        body: {
          imageUrls: imageUrls,
          scanId: Date.now().toString(),
          enableCaching: true,
          parallelProcessing: true
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

      const transformedData = {
        analysis,
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
    setAnalysisResult
  };
};