import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useVinylAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const analyzeImages = async (imageUrls: string[]) => {
    if (imageUrls.length !== 3) {
      toast({
        title: "Error",
        description: "Alle 3 foto's zijn nodig voor analyse",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      // Starting vinyl analysis with images
      
      // Mobile-optimized timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ANALYSIS_TIMEOUT = isMobile ? 30000 : 50000; // 30s mobile, 50s desktop
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

      // Analysis completed successfully
      console.log('📦 Vinyl Analysis raw data:', JSON.stringify(data));

      // The edge function now returns data directly at root level
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
      // Analysis failed
      
      // Reset state on error to prevent hanging
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