import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotifyAIAnalysis {
  personality: {
    title: string;
    summary: string;
    traits: string[];
  };
  trends: {
    description: string;
    rising: string[];
    declining: string[];
  };
  recommendations: {
    description: string;
    artists: string[];
    genres: string[];
  };
  patterns: {
    listeningStyle: string;
    moodProfile: string;
    uniqueness: string;
  };
  collectionComparison: {
    insight: string;
    suggestions: string[];
  };
  funFacts: string[];
}

export interface SpotifyAIResult {
  success: boolean;
  analysis: SpotifyAIAnalysis;
  metadata: {
    tracksAnalyzed: number;
    playlistCount: number;
    topGenresCount: number;
    decadeSpread: number;
    hasPhysicalCollection: boolean;
    physicalCollectionSize: number;
    generatedAt: string;
  };
  error?: string;
}

export const useSpotifyAIAnalysis = (enabled = true) => {
  return useQuery({
    queryKey: ['spotify-ai-analysis'],
    queryFn: async (): Promise<SpotifyAIResult> => {
      const { data, error } = await supabase.functions.invoke('spotify-ai-analysis');
      
      if (error) {
        console.error('Spotify AI analysis error:', error);
        throw new Error(error.message || 'Analyse mislukt');
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Analyse mislukt');
      }
      
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};
