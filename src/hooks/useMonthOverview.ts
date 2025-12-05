import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthRelease {
  artist: string;
  album: string;
  release_date?: string;
  label?: string;
  genre?: string;
  description?: string;
}

export interface MonthNews {
  title: string;
  date?: string;
  summary: string;
  category?: string;
}

export interface MonthInMemoriam {
  name: string;
  age?: number;
  date?: string;
  cause?: string;
  known_for?: string;
}

export interface MonthConcert {
  artist: string;
  tour_name?: string;
  venue?: string;
  city?: string;
  date?: string;
  attendance?: string;
  revenue?: string;
}

export interface MonthStreaming {
  type: string;
  title: string;
  artist?: string;
  statistic?: string;
  platform?: string;
}

export interface MonthAward {
  award_show: string;
  category: string;
  winner: string;
  nominees?: string[];
}

export interface MonthDutchMusic {
  type: string;
  title: string;
  artist?: string;
  description?: string;
}

export interface MonthStory {
  title: string;
  date?: string;
  story: string;
  artists?: string[];
  significance?: string;
}

export interface MonthDataPoints {
  releases: MonthRelease[];
  news: MonthNews[];
  stories: MonthStory[];
  in_memoriam: MonthInMemoriam[];
  concerts: MonthConcert[];
  streaming: MonthStreaming[];
  awards: MonthAward[];
  dutch_music: MonthDutchMusic[];
}

export interface MonthNarratives {
  main: string;
  sections?: Record<string, string>;
}

export interface MonthOverviewData {
  id?: string;
  year: number;
  month: number;
  month_name: string;
  data_points: MonthDataPoints;
  generated_narratives: MonthNarratives;
  sources: string[];
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

const MONTH_NAMES_NL = [
  '', 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export const useMonthOverview = (year: number, month: number) => {
  return useQuery({
    queryKey: ["month-overview", year, month],
    queryFn: async (): Promise<MonthOverviewData | null> => {
      const { data, error } = await supabase
        .from('month_overview_cache')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (error) {
        console.error("Error fetching month overview:", error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        year: data.year,
        month: data.month,
        month_name: data.month_name,
        data_points: data.data_points as MonthDataPoints,
        generated_narratives: data.generated_narratives as MonthNarratives,
        sources: data.sources as string[],
        created_at: data.created_at,
        updated_at: data.updated_at,
        expires_at: data.expires_at
      };
    },
    enabled: year > 0 && month > 0 && month <= 12,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useGenerateMonthOverview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, month, regenerate = false }: { year: number; month: number; regenerate?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-month-overview', {
        body: { year, month, regenerate }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["month-overview", variables.year, variables.month] });
    },
  });
};

export const useAvailableMonths = (year: number) => {
  return useQuery({
    queryKey: ["available-months", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('month_overview_cache')
        .select('month, month_name')
        .eq('year', year)
        .order('month', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: year > 0,
  });
};

export const getMonthName = (month: number): string => {
  return MONTH_NAMES_NL[month] || '';
};

export const getCurrentMonth = (): { year: number; month: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};
