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
      
      const { data, error } = await supabase.functions.invoke('analyze-vinyl-images', {
        body: {
          imageUrls: imageUrls,
          scanId: Date.now().toString()
        }
      });

      if (error) {
        console.error('❌ Analysis error:', error);
        throw error;
      }

      console.log('✅ Analysis completed:', data);

      setAnalysisResult(data);
      
      toast({
        title: "OCR Analyse Voltooid! 🎉",
        description: `Gevonden: ${data.ocr_results.artist || 'Onbekend'} - ${data.ocr_results.title || 'Onbekend'}`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast({
        title: "Analyse Mislukt",
        description: error.message || "Er is een fout opgetreden tijdens de OCR analyse",
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