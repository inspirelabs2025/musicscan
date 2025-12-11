import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CleanAnalyticsSummary {
  date: string;
  total_hits: number;
  real_users: number;
  datacenter_hits: number;
  purity_score: number;
  avg_real_score: number;
}

export interface CleanAnalyticsByCountry {
  display_country: string;
  hit_count: number;
  avg_score: number;
  real_hits: number;
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

export const useCleanAnalyticsSummary = (days: number = 7) => {
  return useQuery({
    queryKey: ['clean-analytics-summary', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('created_at, is_datacenter, real_user_score')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by date
      const byDate = new Map<string, {
        total: number;
        real: number;
        datacenter: number;
        scores: number[];
      }>();
      
      (data || []).forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!byDate.has(date)) {
          byDate.set(date, { total: 0, real: 0, datacenter: 0, scores: [] });
        }
        const entry = byDate.get(date)!;
        entry.total++;
        if (record.is_datacenter) {
          entry.datacenter++;
        } else {
          entry.real++;
          entry.scores.push(record.real_user_score);
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
        });
      });
      
      return summary.sort((a, b) => b.date.localeCompare(a.date));
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCleanAnalyticsByCountry = (days: number = 7) => {
  return useQuery({
    queryKey: ['clean-analytics-by-country', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('country, real_country, is_datacenter, real_user_score')
        .eq('is_datacenter', false)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by country
      const byCountry = new Map<string, {
        hits: number;
        scores: number[];
      }>();
      
      (data || []).forEach(record => {
        const country = record.real_country || record.country || 'Unknown';
        if (!byCountry.has(country)) {
          byCountry.set(country, { hits: 0, scores: [] });
        }
        const entry = byCountry.get(country)!;
        entry.hits++;
        entry.scores.push(record.real_user_score);
      });
      
      const result: CleanAnalyticsByCountry[] = [];
      byCountry.forEach((value, country) => {
        result.push({
          display_country: country,
          hit_count: value.hits,
          avg_score: value.scores.length > 0 
            ? Math.round(value.scores.reduce((a, b) => a + b, 0) / value.scores.length) 
            : 0,
          real_hits: value.hits,
        });
      });
      
      return result.sort((a, b) => b.hit_count - a.hit_count);
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCleanAnalyticsOverview = (days: number = 7) => {
  return useQuery({
    queryKey: ['clean-analytics-overview', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('is_datacenter, datacenter_name, real_user_score, device_type, browser')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      const records = data || [];
      const totalHits = records.length;
      const realUsers = records.filter(r => !r.is_datacenter).length;
      const datacenterHits = records.filter(r => r.is_datacenter).length;
      
      // Calculate confidence-weighted purity score
      // Even "real" users have varying confidence - factor that in
      // Max realistic purity is ~97% (some traffic will always be ambiguous)
      let purityScore = 0;
      if (totalHits > 0) {
        const realUserRecords = records.filter(r => !r.is_datacenter);
        const avgConfidence = realUserRecords.length > 0
          ? realUserRecords.reduce((a, b) => a + b.real_user_score, 0) / realUserRecords.length / 100
          : 0;
        
        // Base purity = real users / total, weighted by confidence
        const basePurity = (realUsers / totalHits) * 100;
        // Apply confidence factor (reduces score based on how confident we are)
        // Also apply a "detection uncertainty" factor of ~3% (we can never be 100% sure)
        const uncertaintyFactor = 0.97; // Max 97% purity possible
        purityScore = Math.min(
          Math.round(basePurity * avgConfidence * uncertaintyFactor * 10) / 10,
          97 // Hard cap at 97%
        );
        
        // If we have very few records, reduce confidence further
        if (totalHits < 10) {
          purityScore = Math.round(purityScore * 0.8 * 10) / 10;
        }
      }
      
      // Datacenter breakdown
      const datacenterBreakdown = new Map<string, number>();
      records.filter(r => r.is_datacenter).forEach(r => {
        const name = r.datacenter_name || 'Unknown';
        datacenterBreakdown.set(name, (datacenterBreakdown.get(name) || 0) + 1);
      });
      
      // Device breakdown (real users only)
      const deviceBreakdown = new Map<string, number>();
      records.filter(r => !r.is_datacenter).forEach(r => {
        const device = r.device_type || 'unknown';
        deviceBreakdown.set(device, (deviceBreakdown.get(device) || 0) + 1);
      });
      
      // Browser breakdown (real users only)
      const browserBreakdown = new Map<string, number>();
      records.filter(r => !r.is_datacenter).forEach(r => {
        const browser = r.browser || 'Unknown';
        browserBreakdown.set(browser, (browserBreakdown.get(browser) || 0) + 1);
      });
      
      return {
        totalHits,
        realUsers,
        datacenterHits,
        purityScore,
        avgRealScore: realUsers > 0 
          ? Math.round(records.filter(r => !r.is_datacenter).reduce((a, b) => a + b.real_user_score, 0) / realUsers)
          : 0,
        datacenterBreakdown: Array.from(datacenterBreakdown.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        deviceBreakdown: Array.from(deviceBreakdown.entries())
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count),
        browserBreakdown: Array.from(browserBreakdown.entries())
          .map(([browser, count]) => ({ browser, count }))
          .sort((a, b) => b.count - a.count),
      };
    },
    staleTime: 2 * 60 * 1000,
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
