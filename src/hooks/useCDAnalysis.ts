import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
        return await fileToBase64(input);
      }
      return input;
    })
  );
  return results;
};

export const useCDAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const analyzeImages = async (imageInputs: (string | File)[]) => {
    if (imageInputs.length < 2) {
      toast({
        title: "Error",
        description: "Minimaal 2 foto's zijn nodig voor CD analyse (voorkant en achterkant)",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert Files to base64 data URLs
      console.log('📸 Converting CD images for analysis...');
      const imageUrls = await convertToUrls(imageInputs);
      console.log('📸 CD Images ready:', imageUrls.length, 'images');
      
      // Mobile-optimized timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ANALYSIS_TIMEOUT = isMobile ? 30000 : 50000;
      
      const analysisPromise = supabase.functions.invoke('analyze-cd-images', {
        body: {
          imageUrls: imageUrls,
          scanId: Date.now().toString(),
          isMobile: isMobile
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('CD analysis timeout - process took too long')), ANALYSIS_TIMEOUT);
      });

      const result = await Promise.race([analysisPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        throw error;
      }

      console.log('📦 CD Analysis raw data:', JSON.stringify(data));

      const analysis = {
        artist: data.artist || null,
        title: data.title || null,
        label: data.label || null,
        catalog_number: data.catalog_number || null,
        barcode: data.barcode || null,
        year: data.year || null,
        format: data.format || 'CD',
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
      
      const releaseInfo = data.discogs_id ? ` (Release ID: ${data.discogs_id})` : '';
      const confidenceInfo = data.confidence?.verified === false ? ' ⚠️ Niet zeker' : '';
      toast({
        title: "CD Analyse Voltooid! 🎉",
        description: `Gevonden: ${analysis.artist || 'Onbekend'} - ${analysis.title || 'Onbekend'}${releaseInfo}${confidenceInfo}`,
        variant: "default"
      });

      return transformedData;
    } catch (error: any) {
      console.error('❌ CD Analysis failed:', error);
      setAnalysisResult(null);
      
      let errorMessage = "Er is een fout opgetreden tijdens de CD analyse";
      let errorTitle = "Analyse Mislukt";
      
      if (error.message?.includes('AI image analysis service unavailable')) {
        errorTitle = "Service Tijdelijk Niet Beschikbaar";
        errorMessage = "De beeldanalyse service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";
      } else if (error.message?.includes('Image processing failed')) {
        errorTitle = "Beeldverwerking Mislukt";
        errorMessage = "De uploaded afbeeldingen konden niet worden verwerkt.";
      } else if (error.message?.includes('timeout')) {
        errorTitle = "Analyse Timeout";
        errorMessage = "Analyse duurde te lang. Probeer opnieuw.";
      }
      
      toast({
        title: errorTitle,
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