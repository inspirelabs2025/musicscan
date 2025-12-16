import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CleanAnalyticsSummary {
  date: string;
  total_hits: number;
  real_users: number;
  datacenter_hits: number;
  purity_score: number;
  avg_real_score: number;
  unique_sessions: number;
}

export interface CleanAnalyticsByCountry {
  display_country: string;
  hit_count: number;
  avg_score: number;
  real_hits: number;
  unique_sessions: number;
}

export interface CleanAnalyticsRecord {
  id: string;
  ip: string | null;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  is_datacenter: boolean;
  datacenter_name: string | null;
  real_country: string | null;
  real_user_score: number;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  path: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ReferrerSource {
  source: string;
  category: 'search' | 'social' | 'direct' | 'referral' | 'other';
  hits: number;
  unique_sessions: number;
  avg_score: number;
}

export interface TopPage {
  path: string;
  hits: number;
  unique_sessions: number;
  avg_score: number;
}

export interface HourlyDistribution {
  hour: number;
  real_users: number;
  datacenter: number;
}

export interface DateRangeParams {
  startDate: Date;
  endDate: Date;
}

export const useCleanAnalyticsSummary = (dateRange: DateRangeParams) => {
  return useQuery({
    queryKey: ['clean-analytics-summary', dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('created_at, is_datacenter, real_user_score, session_id')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
      
      if (error) throw error;
      
      // Group by date
      const byDate = new Map<string, {
        total: number;
        real: number;
        datacenter: number;
        scores: number[];
        sessions: Set<string>;
      }>();
      
      (data || []).forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!byDate.has(date)) {
          byDate.set(date, { total: 0, real: 0, datacenter: 0, scores: [], sessions: new Set() });
        }
        const entry = byDate.get(date)!;
        entry.total++;
        if (record.is_datacenter) {
          entry.datacenter++;
        } else {
          entry.real++;
          entry.scores.push(record.real_user_score);
          if (record.session_id) entry.sessions.add(record.session_id);
        }
      });
      
      const summary: CleanAnalyticsSummary[] = [];
      byDate.forEach((value, date) => {
        // Calculate confidence-weighted purity (max 97%)
        let purityScore = 0;
        if (value.total > 0) {
          const avgConfidence = value.scores.length > 0
            ? value.scores.reduce((a, b) => a + b, 0) / value.scores.length / 100
            : 0;
          const basePurity = (value.real / value.total) * 100;
          purityScore = Math.min(
            Math.round(basePurity * avgConfidence * 0.97 * 10) / 10,
            97
          );
        }
        
        summary.push({
          date,
          total_hits: value.total,
          real_users: value.real,
          datacenter_hits: value.datacenter,
          purity_score: purityScore,
          avg_real_score: value.scores.length > 0 
            ? Math.round(value.scores.reduce((a, b) => a + b, 0) / value.scores.length) 
            : 0,
          unique_sessions: value.sessions.size,
        });
      });
      
      return summary.sort((a, b) => b.date.localeCompare(a.date));
    },
    staleTime: 30 * 1000, // Reduced from 2 min to 30 sec
    refetchOnMount: 'always',
  });
};

export const useCleanAnalyticsByCountry = (dateRange: DateRangeParams) => {
  return useQuery({
    queryKey: ['clean-analytics-by-country', dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: async () => {
      // Use server-side RPC to avoid 1000 row limit
      const { data, error } = await supabase.rpc('get_clean_analytics_countries', {
        p_start_date: dateRange.startDate.toISOString(),
        p_end_date: dateRange.endDate.toISOString(),
      });
      
      if (error) throw error;
      
      return (data || []).map((row: { country_name: string; hit_count: number; real_count: number }) => ({
        display_country: row.country_name,
        hit_count: Number(row.hit_count),
        avg_score: 0, // Not available from RPC
        real_hits: Number(row.real_count),
        unique_sessions: Number(row.real_count), // Approximation
      })) as CleanAnalyticsByCountry[];
    },
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });
};

export const useCleanAnalyticsOverview = (
  dateRange: DateRangeParams, 
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['clean-analytics-overview', dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      // Use server-side RPC functions to avoid 1000 row limit
      const [statsResult, hourlyResult, sourcesResult, devicesResult, datacentersResult] = await Promise.all([
        supabase.rpc('get_clean_analytics_stats', {
          p_start_date: dateRange.startDate.toISOString(),
          p_end_date: dateRange.endDate.toISOString(),
        }),
        supabase.rpc('get_clean_analytics_hourly', {
          p_start_date: dateRange.startDate.toISOString(),
          p_end_date: dateRange.endDate.toISOString(),
        }),
        supabase.rpc('get_clean_analytics_sources', {
          p_start_date: dateRange.startDate.toISOString(),
          p_end_date: dateRange.endDate.toISOString(),
        }),
        supabase.rpc('get_clean_analytics_devices', {
          p_start_date: dateRange.startDate.toISOString(),
          p_end_date: dateRange.endDate.toISOString(),
        }),
        supabase.rpc('get_clean_analytics_datacenters', {
          p_start_date: dateRange.startDate.toISOString(),
          p_end_date: dateRange.endDate.toISOString(),
        }),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (hourlyResult.error) throw hourlyResult.error;
      if (sourcesResult.error) throw sourcesResult.error;
      if (devicesResult.error) throw devicesResult.error;
      if (datacentersResult.error) throw datacentersResult.error;

      const stats = statsResult.data?.[0] || {
        total_hits: 0,
        real_users: 0,
        datacenter_hits: 0,
        unique_sessions: 0,
        purity_score: 0,
        quality_score: 0,
        pages_per_session: 0,
      };

      // Build hourly distribution
      const hourlyDistribution: HourlyDistribution[] = [];
      const hourlyMap = new Map<number, { real: number; datacenter: number }>();
      for (let i = 0; i < 24; i++) hourlyMap.set(i, { real: 0, datacenter: 0 });
      
      (hourlyResult.data || []).forEach((row: { hour_of_day: number; hit_count: number; real_count: number }) => {
        hourlyMap.set(row.hour_of_day, {
          real: Number(row.real_count),
          datacenter: Number(row.hit_count) - Number(row.real_count),
        });
      });
      
      hourlyMap.forEach((value, hour) => {
        hourlyDistribution.push({ hour, real_users: value.real, datacenter: value.datacenter });
      });

      // Build referrer sources
      const referrerSources: ReferrerSource[] = (sourcesResult.data || []).map((row: { source_name: string; hit_count: number; real_count: number }) => {
        let category: 'search' | 'social' | 'direct' | 'referral' | 'other' = 'other';
        if (['Google', 'Bing'].includes(row.source_name)) category = 'search';
        else if (['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].includes(row.source_name)) category = 'social';
        else if (row.source_name === 'Direct') category = 'direct';
        
        return {
          source: row.source_name,
          category,
          hits: Number(row.real_count),
          unique_sessions: Number(row.real_count), // Approximation from RPC
          avg_score: 0,
        };
      });

      // Build device breakdown
      const deviceBreakdown = (devicesResult.data || []).map((row: { device_name: string; real_count: number }) => ({
        device: row.device_name,
        count: Number(row.real_count),
      }));

      // Build datacenter breakdown
      const datacenterBreakdown = (datacentersResult.data || []).map((row: { datacenter: string; hit_count: number }) => ({
        name: row.datacenter,
        count: Number(row.hit_count),
      }));

      return {
        totalHits: Number(stats.total_hits),
        realUsers: Number(stats.real_users),
        datacenterHits: Number(stats.datacenter_hits),
        purityScore: Number(stats.purity_score),
        qualityScore: Number(stats.quality_score),
        uniqueSessions: Number(stats.unique_sessions),
        pagesPerSession: Number(stats.pages_per_session),
        avgRealScore: Number(stats.quality_score),
        datacenterBreakdown,
        deviceBreakdown,
        browserBreakdown: [], // Not needed for main dashboard
        referrerSources,
        topPages: [], // Fetch separately if needed
        hourlyDistribution: hourlyDistribution.sort((a, b) => a.hour - b.hour),
      };
    },
    staleTime: 30 * 1000, // Reduced from 2 min to 30 sec for more real-time data
    refetchOnMount: 'always',
    refetchInterval: 60000, // Auto-refresh every minute
  });
};

export const useRecentCleanAnalytics = (limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-clean-analytics', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as CleanAnalyticsRecord[];
    },
    staleTime: 30 * 1000,
  });
};
