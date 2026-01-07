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
      // Starting CD analysis with images
      
      // Mobile-optimized timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const ANALYSIS_TIMEOUT = isMobile ? 30000 : 50000; // 30s mobile, 50s desktop
      
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

      // CD analysis completed successfully
      console.log('📦 CD Analysis raw data:', JSON.stringify(data));

      // The edge function now returns data directly at root level
      // Format: { artist, title, catalog_number, barcode, confidence, discogs_id, ... }
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

      return data;
    } catch (error) {
      console.error('❌ CD Analysis failed:', error);
      
      // Parse error response for better user feedback
      let errorMessage = "Er is een fout opgetreden tijdens de CD analyse";
      let errorTitle = "Analyse Mislukt";
      
      if (error.message?.includes('AI image analysis service unavailable')) {
        errorTitle = "Service Tijdelijk Niet Beschikbaar";
        errorMessage = "De beeldanalyse service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";
      } else if (error.message?.includes('Image processing failed')) {
        errorTitle = "Beeldverwerking Mislukt";
        errorMessage = "De uploaded afbeeldingen konden niet worden verwerkt. Controleer of de afbeeldingen geldig zijn en probeer opnieuw.";
      } else if (error.message?.includes('Database service temporarily unavailable')) {
        errorTitle = "Database Tijdelijk Niet Beschikbaar";
        errorMessage = "De database service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";
      } else if (error.message?.includes('Network connectivity issue')) {
        errorTitle = "Netwerkverbinding Probleem";
        errorMessage = "Er is een probleem met de netwerkverbinding. Controleer je internetverbinding en probeer opnieuw.";
      } else if (error.message?.includes('CD scanning requires at least 2 images')) {
        errorTitle = "Onvoldoende Afbeeldingen";
        errorMessage = "Voor CD analyse zijn minimaal 2 afbeeldingen nodig (voorkant en achterkant).";
      } else if (error.message?.includes('No meaningful data extracted')) {
        errorTitle = "Geen Gegevens Gevonden";
        errorMessage = "Er konden geen bruikbare gegevens uit de afbeeldingen worden gehaald. Probeer duidelijkere afbeeldingen.";
      } else {
        // Try to extract the error message from the response
        const errorData = error.message || error.toString();
        if (errorData.includes('details:')) {
          const detailsMatch = errorData.match(/details:\s*(.+)/);
          if (detailsMatch) {
            errorMessage = detailsMatch[1];
          }
        }
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