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
      console.log('🎵 Starting vinyl analysis with images:', imageUrls);
      console.log('⚡ Performance: Starting analysis at', new Date().toISOString());
      
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
        console.error('❌ Analysis error:', error);
        throw error;
      }

      console.log('✅ Analysis completed:', data);
      console.log('⚡ Performance: Analysis completed at', new Date().toISOString());

      setAnalysisResult(data);
      
      // Show success with more details about missing data
      const missingBarcode = !data.analysis?.barcode;
      const successMessage = missingBarcode 
        ? `Gevonden: ${data.analysis?.artist || 'Onbekend'} - ${data.analysis?.title || 'Onbekend'} (geen barcode gevonden)`
        : `Gevonden: ${data.analysis?.artist || 'Onbekend'} - ${data.analysis?.title || 'Onbekend'}`;

      toast({
        title: "OCR Analyse Voltooid! 🎉",
        description: successMessage,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
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