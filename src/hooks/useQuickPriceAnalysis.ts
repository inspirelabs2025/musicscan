import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AnalysisResult {
  artist?: string;
  title?: string;
  label?: string;
  catalog_number?: string;
  catalogNumber?: string;
  barcode?: string;
  year?: number;
  format?: string;
  genre?: string;
  country?: string;
  matrix_number?: string;
}

interface QuickPriceAnalysisResult {
  success: boolean;
  analysis?: AnalysisResult;
  discogsData?: {
    discogs_id: number;
    discogs_url: string;
  };
  pricing_stats?: {
    lowest_price: number | null;
    median_price: number | null;
    highest_price: number | null;
    num_for_sale: number;
    currency: string;
  };
}

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';

async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useQuickPriceAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuickPriceAnalysisResult | null>(null);

  const analyzeImages = useCallback(async (
    files: File[],
    mediaType: 'vinyl' | 'cd'
  ): Promise<QuickPriceAnalysisResult | null> => {
    if (files.length === 0) {
      toast({
        title: 'Geen afbeeldingen',
        description: 'Upload minimaal één afbeelding om te analyseren.',
        variant: 'destructive',
      });
      return null;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Convert files to base64
      console.log(`🔄 Converting ${files.length} files to base64...`);
      const base64Images = await Promise.all(files.map(convertFileToBase64));
      console.log(`✅ Converted ${base64Images.length} images to base64`);

      // Determine endpoint based on media type
      const endpoint = mediaType === 'vinyl' 
        ? `${SUPABASE_URL}/functions/v1/analyze-vinyl-images`
        : `${SUPABASE_URL}/functions/v1/analyze-cd-images`;

      console.log(`📡 Sending to ${endpoint}...`);

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 120000); // 2 minute timeout
      });

      // Send base64 images directly to edge function
      const fetchPromise = fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Images,
        }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Analysis result:', data);

      if (data.success === false) {
        throw new Error(data.error || 'Analyse mislukt');
      }

      const result: QuickPriceAnalysisResult = {
        success: true,
        analysis: data.analysis || data.combinedResults || {},
        discogsData: data.discogsData || data.discogsResult,
        pricing_stats: data.pricing_stats || data.pricingData,
      };

      setAnalysisResult(result);

      toast({
        title: 'Analyse voltooid',
        description: result.analysis?.artist && result.analysis?.title
          ? `${result.analysis.artist} - ${result.analysis.title}`
          : 'LP/CD herkend',
      });

      return result;
    } catch (error) {
      console.error('❌ Quick price analysis error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      
      if (errorMessage === 'Timeout') {
        toast({
          title: 'Timeout',
          description: 'De analyse duurde te lang. Probeer het opnieuw.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Analyse mislukt',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    analyzeImages,
    reset,
    setAnalysisResult,
  };
}
