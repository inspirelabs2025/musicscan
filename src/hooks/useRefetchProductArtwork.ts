import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRefetchProductArtwork = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const refetchSingle = async (productId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('refetch-product-artwork', {
        body: { product_id: productId }
      });

      if (error) throw error;

      if (data.results?.[0]?.status === 'success') {
        toast({
          title: "✅ Artwork bijgewerkt",
          description: `Afbeelding succesvol opgehaald van ${data.results[0].source}`,
        });
        return { success: true, data: data.results[0] };
      } else if (data.results?.[0]?.status === 'no_artwork') {
        toast({
          title: "⚠️ Geen artwork gevonden",
          description: "Er is geen afbeelding gevonden voor dit album",
          variant: "destructive",
        });
        return { success: false, error: 'no_artwork' };
      } else {
        throw new Error(data.results?.[0]?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error refetching artwork:', error);
      toast({
        title: "❌ Fout bij ophalen artwork",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const refetchBatch = async (
    productIds: string[], 
    onProgress?: (current: number, total: number, currentProduct?: any) => void
  ) => {
    setIsLoading(true);
    const batchSize = 10;
    const allResults = [];

    try {
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('refetch-product-artwork', {
          body: { product_ids: batch }
        });

        if (error) throw error;

        allResults.push(...(data.results || []));

        // Report progress
        if (onProgress) {
          const currentCount = Math.min(i + batchSize, productIds.length);
          onProgress(currentCount, productIds.length, data.results?.[0]);
        }

        // Small delay between batches
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successCount = allResults.filter(r => r.status === 'success').length;
      const errorCount = allResults.filter(r => r.status === 'error').length;
      const noArtworkCount = allResults.filter(r => r.status === 'no_artwork').length;

      toast({
        title: "✅ Batch verwerking voltooid",
        description: `${successCount} succesvol, ${errorCount} fouten, ${noArtworkCount} geen artwork`,
      });

      return { 
        success: true, 
        results: allResults,
        summary: { successCount, errorCount, noArtworkCount }
      };
    } catch (error: any) {
      console.error('Error in batch refetch:', error);
      toast({
        title: "❌ Fout bij batch verwerking",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    refetchSingle,
    refetchBatch,
    isLoading
  };
};
