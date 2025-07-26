import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlbumInsights {
  historical_context: string;
  artistic_significance: string;
  cultural_impact: string;
  production_story: string;
  musical_innovations: string;
  collector_value: string;
  fun_facts: string[];
  recommended_listening: string[];
  similar_albums: Array<{
    artist: string;
    title: string;
    reason: string;
  }>;
}

export const useAlbumInsights = () => {
  const [insights, setInsights] = useState<AlbumInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateInsights = async (albumId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('album-ai-insights', {
        body: { albumId }
      });

      if (error) throw error;

      setInsights(data);
      
      toast({
        title: "AI Insights Gegenereerd! 🎵",
        description: "Uitgebreide informatie over dit album is nu beschikbaar",
        variant: "default"
      });

    } catch (err) {
      console.error('Error generating insights:', err);
      const errorMessage = err instanceof Error ? err.message : 'Er is een fout opgetreden';
      setError(errorMessage);
      
      toast({
        title: "Fout bij genereren insights",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insights,
    isLoading,
    error,
    generateInsights,
    clearInsights: () => setInsights(null)
  };
};