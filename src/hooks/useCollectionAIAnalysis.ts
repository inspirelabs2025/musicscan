
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MusicHistoryTimeline {
  overview: string;
  keyPeriods: string[];
  culturalMovements: string[];
  musicalEvolution: string;
}

export interface ArtistStories {
  legendaryFigures: string[];
  hiddenConnections: string[];
  collaborationTales: string[];
  artisticJourneys: string[];
  crossGenreInfluences: string[];
}

export interface StudioLegends {
  legendaryStudios: string[];
  iconicProducers: string[];
  recordingInnovations: string[];
  labelHistories: string[];
  soundEngineering: string[];
}

export interface CulturalImpact {
  societalInfluence: string[];
  generationalMovements: string[];
  politicalMessages: string[];
  fashionAndStyle: string[];
  globalReach: string[];
}

export interface MusicalInnovations {
  technicalBreakthroughs: string[];
  genreCreation: string[];
  instrumentalPioneering: string[];
  vocalTechniques: string[];
  productionMethods: string[];
}

export interface HiddenGems {
  underratedMasterpieces: string[];
  rareFfinds: string[];
  collectorSecrets: string[];
  sleepersHits: string[];
  deepCuts: string[];
}

export interface MusicalConnections {
  genreEvolution: string[];
  artistInfluences: string[];
  labelConnections: string[];
  sceneConnections: string[];
  crossPollination: string[];
}

export interface TechnicalMastery {
  soundQuality: string;
  formatSignificance: string;
  pressingQuality: string;
  artwork: string;
  packaging: string;
}

export interface DiscoveryPaths {
  nextExplorations: string[];
  relatedArtists: string[];
  genreExpansions: string[];
  eraExplorations: string[];
  labelDiveDeeps: string[];
}

export interface AIAnalysis {
  musicHistoryTimeline: MusicHistoryTimeline;
  artistStories: ArtistStories;
  studioLegends: StudioLegends;
  culturalImpact: CulturalImpact;
  musicalInnovations: MusicalInnovations;
  hiddenGems: HiddenGems;
  musicalConnections: MusicalConnections;
  technicalMastery: TechnicalMastery;
  discoveryPaths: DiscoveryPaths;
}

export interface ChartData {
  genreDistribution: { name: string; value: number; percentage: number }[];
  formatDistribution: { name: string; value: number; fill: string }[];
  topArtists: { name: string; albums: number; genres: string[] }[];
  decadeDistribution: { decade: string; count: number; genres: number; artists: number; percentage: number }[];
  labelAnalysis: { label: string; releases: number; artists: number; genres: number; diversity: number }[];
  artistConnections: { artist: string; albums: number; genres: string[]; yearSpan: string; labels: string[] }[];
}

export interface CollectionStats {
  totalItems: number;
  spotifyTracks: number;
  spotifyPlaylists: number;
  uniqueArtists: number;
  uniqueLabels: number;
  uniqueGenres: number;
  oldestItem: number;
  newestItem: number;
  totalValue: number;
  avgValue: number;
  itemsWithPricing: number;
  timeSpan: number;
  cdCount: number;
  vinylCount: number;
  hasPhysicalCollection: boolean;
  hasSpotifyData: boolean;
  physicalArtistsCount: number;
  spotifyArtistsCount: number;
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
      const { data, error } = await supabase.functions.invoke('collection-ai-analysis', {
        body: {} // Empty body, function will use auth user automatically
      });
      
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
