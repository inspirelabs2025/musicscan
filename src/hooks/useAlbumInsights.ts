import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlbumInsights {
  // New structured story format
  story_markdown?: string;
  generation_method?: string;
  album_info?: {
    artist: string;
    title: string;
    label?: string;
    year?: number;
    genre?: string;
    country?: string;
    catalog_number?: string;
  };
  
  // Legacy format (backward compatibility)
  historical_context?: string;
  artistic_significance?: string;
  cultural_impact?: string;
  production_story?: string;
  musical_innovations?: string;
  collector_value?: string;
  fun_facts?: string[];
  recommended_listening?: string[];
  similar_albums?: Array<{
    artist: string;
    title: string;
    reason: string;
  }>;
}

export const useAlbumInsights = (albumId?: string, albumType?: 'cd' | 'vinyl', autoGenerate: boolean = false) => {
  const [insights, setInsights] = useState<AlbumInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for cached insights first
  const checkCachedInsights = async (id: string, type: 'cd' | 'vinyl') => {
    try {
      const { data, error } = await supabase
        .from('album_insights')
        .select('insights_data, cached_until')
        .eq('album_id', id)
        .eq('album_type', type)
        .maybeSingle();

      if (error) throw error;

      if (data && data.cached_until && new Date(data.cached_until) > new Date()) {
        console.log('🎯 Found cached insights for album:', id);
        setInsights(data.insights_data as unknown as AlbumInsights);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking cached insights:', error);
      return false;
    }
  };

  const generateInsights = async (albumIdToGenerate: string, albumTypeToGenerate?: 'cd' | 'vinyl') => {
    if (isLoading) return; // Prevent multiple concurrent requests
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('🤖 Generating AI insights for album:', albumIdToGenerate, 'type:', albumTypeToGenerate);

      const { data, error } = await supabase.functions.invoke('album-ai-insights', {
        body: { 
          albumId: albumIdToGenerate,
          albumType: albumTypeToGenerate 
        }
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

  // Auto-generate insights when albumId and albumType are provided
  useEffect(() => {
    if (autoGenerate && albumId && albumType && !insights && !isLoading) {
      console.log('🚀 Auto-generating insights for:', albumId, albumType);
      
      // First check for cached insights
      checkCachedInsights(albumId, albumType).then((foundCached) => {
        if (!foundCached) {
          // No cached insights found, generate new ones
          generateInsights(albumId, albumType);
        }
      });
    }
  }, [albumId, albumType, autoGenerate, insights, isLoading]);

  return {
    insights,
    isLoading,
    error,
    generateInsights,
    checkCachedInsights,
    clearInsights: () => setInsights(null)
  };
};