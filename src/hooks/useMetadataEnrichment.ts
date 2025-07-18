
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMetadataEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const { toast } = useToast();

  const enrichMetadata = async () => {
    setIsEnriching(true);
    setEnrichmentProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-collection-metadata');

      if (error) throw error;

      setEnrichmentProgress(100);
      
      toast({
        title: "Metadata Verrijking Voltooid! 🎉",
        description: `${data.enrichedCount} items verrijkt met extra informatie`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Metadata enrichment failed:', error);
      toast({
        title: "Metadata Verrijking Mislukt",
        description: "Er is een fout opgetreden tijdens het verrijken van metadata",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsEnriching(false);
    }
  };

  return {
    enrichMetadata,
    isEnriching,
    enrichmentProgress
  };
};
