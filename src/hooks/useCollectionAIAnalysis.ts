
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CollectionProfile {
  summary: string;
  keyHighlights: string[];
  musicianship: string;
  culturalImpact: string;
}

export interface HistoricalContext {
  timeline: string;
  movements: string[];
  innovations: string[];
}

export interface ArtisticConnections {
  collaborations: string[];
  influences: string[];
  producerStories: string[];
  labelLegacy: string;
}

export interface MusicalAnalysis {
  genres: string[];
  soundscapes: string[];
  techniques: string[];
  instruments: string[];
}

export interface CollectionInsights {
  rarities: string[];
  hiddenGems: string[];
  completionSuggestions: string[];
  nextDiscoveries: string[];
  uniqueMagic: string[];
  redThread: string[];
  musicalJourney: string[];
}

export interface MarketAnalysis {
  valuableFinds: string[];
  investmentPotential: string;
  marketTrends: string[];
  preservationTips: string[];
}

export interface TechnicalDetails {
  formats: string;
  pressings: string;
  soundQuality: string;
  packaging: string;
}

export interface MusicPersonality {
  type: string;
  description: string;
  traits: string[];
  listeningStyle: string;
  musicDNA: string;
  profile: string;
}

export interface CollectionStory {
  origin: string;
  evolution: string;
  currentPhase: string;
  futureDirection: string;
}

export interface PriceAnalysis {
  overview: string;
  mostValuable: string[];
  hiddenGems: string[];
  marketTrends: string[];
  investmentTips: string[];
  marketTales: string[];
  investmentStory: string;
  collectorWisdom: string[];
  valueSecrets: string[];
  portfolioStory: string;
}

export interface Recommendations {
  nextPurchases: string[];
  genreExpansion: string[];
  artistDeepDives: string[];
  rareFfinds: string[];
  nextAdventures: string[];
}

export interface AIAnalysis {
  collectionProfile: CollectionProfile;
  historicalContext: HistoricalContext;
  artisticConnections: ArtisticConnections;
  musicalAnalysis: MusicalAnalysis;
  collectionInsights: CollectionInsights;
  marketAnalysis: MarketAnalysis;
  funFacts: string[];
  technicalDetails: TechnicalDetails;
  musicPersonality: MusicPersonality;
  collectionStory: CollectionStory;
  priceAnalysis: PriceAnalysis;
  recommendations: Recommendations;
}

export interface ChartData {
  genreDistribution: { name: string; value: number; percentage: number }[];
  formatDistribution: { name: string; value: number; fill: string }[];
  topArtists: { name: string; albums: number }[];
  decadeDistribution: { decade: string; count: number; genres: number; artists: number }[];
  valueByGenre: { genre: string; count: number; totalValue: number; avgPrice: number }[];
  priceByDecade: { decade: string; avgPrice: number; totalValue: number }[];
}

export interface CollectionStats {
  totalItems: number;
  uniqueArtists: number;
  uniqueLabels: number;
  oldestItem: number;
  newestItem: number;
  totalValue: number;
  avgValue: number;
  itemsWithPricing: number;
  mostValuableItems: any[];
  genres: number;
  artists: number;
  priceStats: {
    total: number;
    average: number;
  };
}

export interface CollectionAIAnalysisResult {
  success: boolean;
  analysis: AIAnalysis;
  stats: CollectionStats;
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
        console.error('AI Analysis failed:', error);
        throw new Error(`AI Analysis failed: ${error.message}`);
      }
      
      if (!data.success) {
        console.error('AI Analysis unsuccessful:', data.error);
        throw new Error(data.error || 'AI Analysis failed');
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

