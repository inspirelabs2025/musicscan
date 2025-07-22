
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysis {
  musicPersonality: {
    profile: string;
    traits: string[];
    musicDNA: string;
  };
  priceAnalysis: {
    treasureHunt: string;
    investmentStory: string;
    marketTales: string;
    collectorWisdom: string;
    portfolioStory: string;
    valueSecrets: string;
  };
  collectionInsights: {
    uniqueMagic: string;
    redThread: string;
    curationStyle: string;
    musicalJourney: string;
  };
  artistConnections: {
    collaborationWeb: string[];
    labelStories: string[];
    producerTales: string[];
    genreEvolution: string;
  };
  investmentInsights: {
    hiddenTreasures: string[];
    crownJewels: string[];
    marketProphecy: string;
    completionQuests: string[];
  };
  culturalContext: {
    timeTravel: string[];
    movements: string[];
    worldMap: string;
    lifeTimeline: string;
  };
  funFacts: string[];
  recommendations: {
    nextAdventures: string[];
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
  valueDistribution: { range: string; count: number; totalValue?: number; }[];
  countryDistribution: { country: string; count: number; }[];
  styleDistribution: { name: string; value: number; }[];
  decadeFlow: { decade: number; count: number; genres: number; artists: number; label: string; }[];
  priceByDecade: { decade: string; avgPrice: number; count: number; totalValue: number; }[];
  valueByGenre: { genre: string; avgPrice: number; count: number; totalValue: number; }[];
  investmentHeatmap: { artist: string; title: string; year: number; currentValue: number; growthPotential: number; }[];
  portfolioComposition: {
    byFormat: { format: string; count: number; }[];
    byDecade: { decade: string; avgPrice: number; count: number; totalValue: number; }[];
    byGenre: { genre: string; avgPrice: number; count: number; totalValue: number; }[];
    byValue: { range: string; count: number; totalValue: number; }[];
  };
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
