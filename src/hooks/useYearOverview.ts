import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface YearOverviewStats {
  year: number;
  total_scans: number;
  vinyl_count: number;
  cd_count: number;
  vinyl_percentage: number;
  unique_artists: number;
  avg_median_price: number;
  new_users: number;
  total_stories: number;
  total_products: number;
}

export interface GenreData {
  genre: string;
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
}

export interface DecadeData {
  decade: string;
  count: number;
}

export interface MonthlyData {
  month: number;
  month_name: string;
  scans: number;
  avg_price: number;
}

export interface TopArtist {
  artist: string;
  count: number;
  avg_value: number;
}

export interface PriceInsights {
  highest_valued: Array<{
    artist: string;
    title: string;
    median_price: number;
    format: string;
  }>;
  price_ranges: Array<{
    price_range: string;
    count: number;
  }>;
}

export interface YearOverviewData {
  year: number;
  data_points: {
    stats: YearOverviewStats;
    genres: GenreData[];
    countries: CountryData[];
    decades: DecadeData[];
    monthly: MonthlyData[];
    topArtists: TopArtist[];
    priceInsights: PriceInsights;
  };
  generated_narratives: Record<string, string>;
  created_at: string;
  expires_at: string;
}

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
        return cached as unknown as YearOverviewData;
      }

      // If no cache, fetch fresh data from RPC functions
      const [stats, genres, countries, decades, monthly, topArtists, priceInsights] = await Promise.all([
        supabase.rpc('get_year_overview_stats', { p_year: year }),
        supabase.rpc('get_genre_distribution_by_year', { p_year: year }),
        supabase.rpc('get_country_distribution_by_year', { p_year: year }),
        supabase.rpc('get_decade_distribution_by_year', { p_year: year }),
        supabase.rpc('get_monthly_trends_by_year', { p_year: year }),
        supabase.rpc('get_top_artists_by_year', { p_year: year, p_limit: 10 }),
        supabase.rpc('get_price_insights_by_year', { p_year: year })
      ]);

      return {
        year,
        data_points: {
          stats: stats.data || {} as YearOverviewStats,
          genres: genres.data || [],
          countries: countries.data || [],
          decades: decades.data || [],
          monthly: monthly.data || [],
          topArtists: topArtists.data || [],
          priceInsights: priceInsights.data || { highest_valued: [], price_ranges: [] }
        },
        generated_narratives: {},
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
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
      return data as YearOverviewData;
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
      // Return last 5 years as options
      return Array.from({ length: 5 }, (_, i) => currentYear - i);
    },
    staleTime: Infinity,
  });
};
