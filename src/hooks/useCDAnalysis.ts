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
      
      const releaseInfo = data.discogsData?.discogs_id ? ` (Release ID: ${data.discogsData.discogs_id})` : '';
      toast({
        title: "CD Analyse Voltooid! 🎉",
        description: `Gevonden: ${data.ocr_results.artist || 'Onbekend'} - ${data.ocr_results.title || 'Onbekend'}${releaseInfo}`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('❌ CD Analysis failed:', error);
      
      // Parse error response for better user feedback
      let errorMessage = "Er is een fout opgetreden tijdens de CD analyse";
      let errorTitle = "Analyse Mislukt";
      
      if (error.message?.includes('AI image analysis service unavailable')) {
        errorTitle = "AI Service Tijdelijk Niet Beschikbaar";
        errorMessage = "De AI beeldanalyse service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";
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