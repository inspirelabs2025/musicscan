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

export interface ChartData {
  genreDistribution: { name: string; value: number; percentage: number; }[];
  formatDistribution: { name: string; value: number; fill: string; }[];
  topArtists: { name: string; albums: number; }[];
  yearDistribution: { decade: string; count: number; }[];
  labelDistribution: { name: string; releases: number; }[];
  valueDistribution: { range: string; count: number; }[];
  countryDistribution: { country: string; count: number; }[];
}

export interface CollectionAIAnalysisResult {
  success: boolean;
  analysis: AIAnalysis;
  stats: any;
  chartData: ChartData;
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