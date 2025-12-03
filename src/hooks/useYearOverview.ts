import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============ TYPE DEFINITIONS ============

export interface TopArtist {
  name: string;
  achievement: string;
  genre: string;
  image_url?: string;
  albums_released?: number;
  total_streams_billions?: number;
  notable_songs?: string[];
}

export interface TopAlbum {
  artist: string;
  title: string;
  description: string;
  image_url?: string;
  release_date?: string;
  label?: string;
  weeks_on_chart?: number;
  certifications?: string[];
}

export interface Award {
  category: string;
  winner: string;
  other_nominees?: string[];
}

export interface InMemoriamArtist {
  name: string;
  years: string;
  known_for: string;
  image_url?: string;
  date_of_death?: string;
  age?: number;
  cause?: string;
  notable_works?: string[];
  legacy?: string;
}

export interface GenreData {
  genre: string;
  count?: number;
  percentage?: number;
  top_songs?: string[];
  growth_percentage?: number;
  key_artists?: string[];
}

export interface TourInfo {
  artist: string;
  tour_name: string;
  gross?: number;
  gross_millions?: number;
  shows?: number;
  attendance_millions?: number;
  notable_venues?: string[];
}

export interface ViralHit {
  song: string;
  artist: string;
  platform?: string;
  streams_millions?: number;
  viral_reason?: string;
}

export interface FestivalInfo {
  name: string;
  headliners?: string[];
  attendance?: number;
  notable_moments?: string;
}

export interface IndustryStats {
  total_albums_released?: number;
  total_songs_released?: number;
  vinyl_sales_growth_percentage?: number;
  streaming_revenue_billions?: number;
  live_music_revenue_billions?: number;
  notable_record_deals?: string[];
  major_label_news?: string[];
}

export interface YearOverviewSections {
  global_overview: {
    narrative: string;
    highlights?: string[];
  };
  top_artists: TopArtist[];
  top_albums: TopAlbum[];
  awards: {
    narrative: string;
    grammy: Award[];
    brit_awards: Award[];
    edison: Award[];
    mtv_vma?: Award[];
    billboard_achievements?: string[];
  };
  in_memoriam: {
    narrative: string;
    artists: InMemoriamArtist[];
  };
  dutch_music: {
    narrative: string;
    highlights: string[];
    top_artists: string[];
    edison_winners: Award[];
    top_40_records?: string[];
    festivals_nl?: string[];
  };
  streaming_viral: {
    narrative: string;
    viral_hits: (string | ViralHit)[];
    streaming_records: string[];
    spotify_wrapped?: {
      most_streamed_artist?: string;
      most_streamed_song?: string;
      most_streamed_album?: string;
    };
    tiktok_trends?: string[];
  };
  tours_festivals: {
    narrative: string;
    biggest_tours: TourInfo[];
    festivals: (string | FestivalInfo)[];
    venue_records?: string[];
  };
  genre_trends: {
    narrative: string;
    rising_genres?: (string | GenreData)[];
    popular_genres: GenreData[];
    declining_genres?: string[];
    fusion_trends?: string[];
  };
  industry_stats?: IndustryStats;
}

export interface SpotifyData {
  newReleases: Array<{
    name: string;
    artists: Array<{ name: string }>;
    images: Array<{ url: string }>;
    release_date: string;
    external_urls: { spotify: string };
  }>;
  featuredPlaylists: any[];
  fetchedAt: string;
}

export interface DiscogsData {
  topReleases: Array<{
    title: string;
    year: number;
    genre: string[];
    style: string[];
    thumb: string;
    country: string;
  }>;
  vinylReleases: any[];
  genreDistribution: Array<{ genre: string; count: number }>;
  styleDistribution: Array<{ style: string; count: number }>;
  totalResults: number;
  fetchedAt: string;
}

export interface PerplexityData {
  awards: string;
  events: string;
  inMemoriam: string;
  trends: string;
  dutchMusic: string;
  fetchedAt: string;
}

export interface YearOverviewData {
  year: number;
  data_points: {
    spotify: SpotifyData | null;
    discogs: DiscogsData | null;
    perplexity: PerplexityData | null;
  };
  generated_narratives: YearOverviewSections;
  sources: {
    spotify: boolean;
    discogs: boolean;
    perplexity: boolean;
  };
  created_at: string;
  expires_at: string;
}

// ============ HOOKS ============

export const useYearOverview = (year: number = new Date().getFullYear()) => {
  return useQuery({
    queryKey: ['year-overview', year],
    queryFn: async (): Promise<YearOverviewData | null> => {
      // First check cache
      const { data: cached, error: cacheError } = await supabase
        .from('year_overview_cache')
        .select('*')
        .eq('year', year)
        .eq('filter_hash', 'default')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached && !cacheError) {
        return transformCacheData(cached);
      }

      // If no cache, return null - user needs to generate
      return null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGenerateYearOverview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ year, regenerate = false }: { year: number; regenerate?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-year-overview', {
        body: { year, regenerate }
      });

      if (error) throw error;
      return transformCacheData(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['year-overview', data.year] });
    }
  });
};

export const useAvailableYears = () => {
  return useQuery({
    queryKey: ['available-years'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      // Return last 10 years as options
      return Array.from({ length: 10 }, (_, i) => currentYear - i);
    },
    staleTime: Infinity,
  });
};

// ============ HELPERS ============

function transformCacheData(data: any): YearOverviewData {
  return {
    year: data.year,
    data_points: data.data_points || { spotify: null, discogs: null, perplexity: null },
    generated_narratives: data.generated_narratives || getEmptySections(),
    sources: data.sources || { spotify: false, discogs: false, perplexity: false },
    created_at: data.created_at || new Date().toISOString(),
    expires_at: data.expires_at || new Date().toISOString()
  };
}

function getEmptySections(): YearOverviewSections {
  return {
    global_overview: { narrative: '' },
    top_artists: [],
    top_albums: [],
    awards: { narrative: '', grammy: [], brit_awards: [], edison: [] },
    in_memoriam: { narrative: '', artists: [] },
    dutch_music: { narrative: '', highlights: [], top_artists: [], edison_winners: [] },
    streaming_viral: { narrative: '', viral_hits: [], streaming_records: [] },
    tours_festivals: { narrative: '', biggest_tours: [], festivals: [] },
    genre_trends: { narrative: '', popular_genres: [] }
  };
}
