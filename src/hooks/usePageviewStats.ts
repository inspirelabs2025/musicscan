import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageviewStat {
  path: string;
  page_title: string | null;
  view_count: number;
  unique_sessions: number;
}

export interface PageviewStatsOptions {
  days?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch pageview statistics for admin dashboard
 * Requires admin role to access
 */
export const usePageviewStats = (options: PageviewStatsOptions = {}) => {
  const { days = 7, enabled = true } = options;

  return useQuery<PageviewStat[]>({
    queryKey: ['pageview-stats', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pageview_stats', {
        p_days: days
      });

      if (error) throw error;
      return (data || []) as PageviewStat[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get total pageview count for a specific period
 */
export const usePageviewTotals = (days: number = 7) => {
  return useQuery({
    queryKey: ['pageview-totals', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { count, error } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });
};
