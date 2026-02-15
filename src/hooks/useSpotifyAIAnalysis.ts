import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MoodEntry {
  mood: string;
  percentage: number;
  color: string;
}

export interface ArtistCluster {
  name: string;
  artists: string[];
  connection: string;
}

export interface JourneyPhase {
  period: string;
  description: string;
}

export interface SpotifyAIAnalysis {
  personality: {
    title: string;
    summary: string;
    traits: string[];
  };
  genreEcosystem: {
    mainGenres: string[];
    nicheGenres: string[];
    mainstreamRatio: number;
    description: string;
    connections: string[];
  };
  explorerProfile: {
    score: number;
    label: string;
    diversity: string;
    obscurity: string;
    adventurousness: string;
  };
  emotionalLandscape: {
    dominantMood: string;
    moodPalette: MoodEntry[];
    description: string;
  };
  listeningJourney: {
    evolution: string;
    phases: JourneyPhase[];
    turningPoints: string[];
  };
  artistNetwork: {
    description: string;
    clusters: ArtistCluster[];
    influences: string[];
  };
  collectionBridge: {
    overlapInsight: string;
    genreShifts: string;
    decadeShifts: string;
    blindSpots: {
      physicalMissing: string[];
      digitalMissing: string[];
    };
    suggestions: string[];
    stats: {
      totalPhysical: number;
      totalSpotify: number;
      overlap: number;
      onlyPhysical: number;
      onlySpotify: number;
    };
  };
  hiddenGems: {
    description: string;
    gems: string[];
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
    albums?: string[];
  };
  funFacts: string[];
  // Legacy fallback fields
  patterns?: {
    listeningStyle: string;
    moodProfile: string;
    uniqueness: string;
  };
  collectionComparison?: {
    insight: string;
    suggestions: string[];
  };
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
    physicalCDs?: number;
    physicalVinyl?: number;
    overlapArtists?: number;
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
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};
