import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useCDAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const analyzeImages = async (imageUrls: string[]) => {
    if (imageUrls.length < 2) {
      toast({
        title: "Error",
        description: "Minimaal 2 foto's zijn nodig voor CD analyse (voorkant en achterkant)",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('💿 Starting CD analysis with images:', imageUrls);
      
      const { data, error } = await supabase.functions.invoke('analyze-cd-images', {
        body: {
          imageUrls: imageUrls,
          scanId: Date.now().toString()
        }
      });

      if (error) {
        console.error('❌ CD Analysis error:', error);
        throw error;
      }

      console.log('✅ CD Analysis completed:', data);

      setAnalysisResult(data);
      
      toast({
        title: "CD Analyse Voltooid! 🎉",
        description: `Gevonden: ${data.ocrResults.artist || 'Onbekend'} - ${data.ocrResults.title || 'Onbekend'}`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('❌ CD Analysis failed:', error);
      toast({
        title: "Analyse Mislukt",
        description: error.message || "Er is een fout opgetreden tijdens de CD analyse",
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