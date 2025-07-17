import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysis {
  musicPersonality: {
    profile: string;
    traits: string[];
    musicDNA: string;
  };
  collectionInsights: {
    uniqueness: string;
    coherence: string;
    curation: string;
    evolution: string;
  };
  artistConnections: {
    collaborations: string[];
    labelConnections: string[];
    producerInsights: string[];
    genreEvolution: string;
  };
  investmentInsights: {
    hiddenGems: string[];
    premiumItems: string[];
    trends: string;
    completionOpportunities: string[];
  };
  culturalContext: {
    decades: string[];
    movements: string[];
    geography: string;
    timeline: string;
  };
  funFacts: string[];
  recommendations: {
    nextPurchases: string[];
    genreExploration: string[];
    artistDiscovery: string[];
    collectionGaps: string[];
  };
  collectionStory: string;
}

export interface CollectionAIAnalysisResult {
  success: boolean;
  analysis: AIAnalysis;
  stats: any;
  generatedAt: string;
  error?: string;
}

export const useCollectionAIAnalysis = () => {
  return useQuery({
    queryKey: ["collection-ai-analysis"],
    queryFn: async (): Promise<CollectionAIAnalysisResult> => {
      const { data, error } = await supabase.functions.invoke('collection-ai-analysis');
      
      if (error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'AI Analysis failed');
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};