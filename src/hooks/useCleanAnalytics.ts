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

export const useCleanAnalyticsSummary = (days: number = 7) => {
  return useQuery({
    queryKey: ['clean-analytics-summary', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('clean_analytics')
        .select('created_at, is_datacenter, real_user_score, session_id')
        .gte('created_at', startDate.toISOString());
      
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
        .select('country, real_country, is_datacenter, real_user_score, session_id')
        .eq('is_datacenter', false)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by country
      const byCountry = new Map<string, {
        hits: number;
        scores: number[];
        sessions: Set<string>;
      }>();
      
      (data || []).forEach(record => {
        const country = record.real_country || record.country || 'Unknown';
        if (!byCountry.has(country)) {
          byCountry.set(country, { hits: 0, scores: [], sessions: new Set() });
        }
        const entry = byCountry.get(country)!;
        entry.hits++;
        entry.scores.push(record.real_user_score);
        if (record.session_id) entry.sessions.add(record.session_id);
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
          unique_sessions: value.sessions.size,
        });
      });
      
      return result.sort((a, b) => b.unique_sessions - a.unique_sessions);
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
        .select('is_datacenter, datacenter_name, real_user_score, device_type, browser, session_id, referrer, path, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      const records = data || [];
      const totalHits = records.length;
      const realUserRecords = records.filter(r => !r.is_datacenter);
      const realUsers = realUserRecords.length;
      const datacenterHits = records.filter(r => r.is_datacenter).length;
      
      // Unique sessions (real users only)
      const uniqueSessions = new Set(realUserRecords.filter(r => r.session_id).map(r => r.session_id)).size;
      
      // Pages per session (engagement metric)
      const sessionPageCounts = new Map<string, number>();
      realUserRecords.forEach(r => {
        if (r.session_id) {
          sessionPageCounts.set(r.session_id, (sessionPageCounts.get(r.session_id) || 0) + 1);
        }
      });
      const pagesPerSession = sessionPageCounts.size > 0
        ? Math.round(Array.from(sessionPageCounts.values()).reduce((a, b) => a + b, 0) / sessionPageCounts.size * 10) / 10
        : 0;
      
      // Calculate confidence-weighted purity score
      let purityScore = 0;
      let qualityScore = 0;
      if (totalHits > 0) {
        const avgConfidence = realUserRecords.length > 0
          ? realUserRecords.reduce((a, b) => a + b.real_user_score, 0) / realUserRecords.length / 100
          : 0;
        
        const basePurity = (realUsers / totalHits) * 100;
        const uncertaintyFactor = 0.97;
        purityScore = Math.min(
          Math.round(basePurity * avgConfidence * uncertaintyFactor * 10) / 10,
          97
        );
        
        // Quality score = weighted avg of real_user_scores for real traffic
        qualityScore = realUserRecords.length > 0
          ? Math.round(realUserRecords.reduce((a, b) => a + b.real_user_score, 0) / realUserRecords.length)
          : 0;
        
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
      realUserRecords.forEach(r => {
        const device = r.device_type || 'unknown';
        deviceBreakdown.set(device, (deviceBreakdown.get(device) || 0) + 1);
      });
      
      // Browser breakdown (real users only)
      const browserBreakdown = new Map<string, number>();
      realUserRecords.forEach(r => {
        const browser = r.browser || 'Unknown';
        browserBreakdown.set(browser, (browserBreakdown.get(browser) || 0) + 1);
      });
      
      // Referrer sources (real users only)
      const referrerMap = new Map<string, { hits: number; sessions: Set<string>; scores: number[] }>();
      realUserRecords.forEach(r => {
        let source = 'Direct';
        let category: 'search' | 'social' | 'direct' | 'referral' | 'other' = 'direct';
        
        if (r.referrer) {
          const ref = r.referrer.toLowerCase();
          if (ref.includes('google.') || ref.includes('bing.') || ref.includes('duckduckgo') || ref.includes('yahoo.') || ref.includes('ecosia')) {
            source = ref.includes('google.') ? 'Google' : ref.includes('bing.') ? 'Bing' : ref.includes('duckduckgo') ? 'DuckDuckGo' : ref.includes('yahoo.') ? 'Yahoo' : 'Ecosia';
            category = 'search';
          } else if (ref.includes('facebook.') || ref.includes('instagram.') || ref.includes('twitter.') || ref.includes('linkedin.') || ref.includes('tiktok.') || ref.includes('pinterest.')) {
            source = ref.includes('facebook.') ? 'Facebook' : ref.includes('instagram.') ? 'Instagram' : ref.includes('twitter.') || ref.includes('x.com') ? 'X/Twitter' : ref.includes('linkedin.') ? 'LinkedIn' : ref.includes('tiktok.') ? 'TikTok' : 'Pinterest';
            category = 'social';
          } else if (ref.includes('musicscan.')) {
            source = 'Internal';
            category = 'referral';
          } else {
            try {
              source = new URL(r.referrer).hostname.replace('www.', '');
            } catch {
              source = 'Other';
            }
            category = 'referral';
          }
        }
        
        if (!referrerMap.has(source)) {
          referrerMap.set(source, { hits: 0, sessions: new Set(), scores: [] });
        }
        const entry = referrerMap.get(source)!;
        entry.hits++;
        if (r.session_id) entry.sessions.add(r.session_id);
        entry.scores.push(r.real_user_score);
      });
      
      const referrerSources: ReferrerSource[] = [];
      referrerMap.forEach((value, source) => {
        let category: 'search' | 'social' | 'direct' | 'referral' | 'other' = 'other';
        if (['Google', 'Bing', 'DuckDuckGo', 'Yahoo', 'Ecosia'].includes(source)) category = 'search';
        else if (['Facebook', 'Instagram', 'X/Twitter', 'LinkedIn', 'TikTok', 'Pinterest'].includes(source)) category = 'social';
        else if (source === 'Direct') category = 'direct';
        else if (source === 'Internal') category = 'referral';
        
        referrerSources.push({
          source,
          category,
          hits: value.hits,
          unique_sessions: value.sessions.size,
          avg_score: value.scores.length > 0 ? Math.round(value.scores.reduce((a, b) => a + b, 0) / value.scores.length) : 0,
        });
      });
      
      // Top pages (real users only)
      const pageMap = new Map<string, { hits: number; sessions: Set<string>; scores: number[] }>();
      realUserRecords.forEach(r => {
        const path = r.path || '/';
        if (!pageMap.has(path)) {
          pageMap.set(path, { hits: 0, sessions: new Set(), scores: [] });
        }
        const entry = pageMap.get(path)!;
        entry.hits++;
        if (r.session_id) entry.sessions.add(r.session_id);
        entry.scores.push(r.real_user_score);
      });
      
      const topPages: TopPage[] = [];
      pageMap.forEach((value, path) => {
        topPages.push({
          path,
          hits: value.hits,
          unique_sessions: value.sessions.size,
          avg_score: value.scores.length > 0 ? Math.round(value.scores.reduce((a, b) => a + b, 0) / value.scores.length) : 0,
        });
      });
      
      // Hourly distribution
      const hourlyMap = new Map<number, { real: number; datacenter: number }>();
      for (let i = 0; i < 24; i++) hourlyMap.set(i, { real: 0, datacenter: 0 });
      
      records.forEach(r => {
        const hour = new Date(r.created_at).getHours();
        const entry = hourlyMap.get(hour)!;
        if (r.is_datacenter) {
          entry.datacenter++;
        } else {
          entry.real++;
        }
      });
      
      const hourlyDistribution: HourlyDistribution[] = [];
      hourlyMap.forEach((value, hour) => {
        hourlyDistribution.push({ hour, real_users: value.real, datacenter: value.datacenter });
      });
      
      return {
        totalHits,
        realUsers,
        datacenterHits,
        purityScore,
        qualityScore,
        uniqueSessions,
        pagesPerSession,
        avgRealScore: realUsers > 0 
          ? Math.round(realUserRecords.reduce((a, b) => a + b.real_user_score, 0) / realUsers)
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
        referrerSources: referrerSources.sort((a, b) => b.unique_sessions - a.unique_sessions),
        topPages: topPages.sort((a, b) => b.unique_sessions - a.unique_sessions).slice(0, 15),
        hourlyDistribution: hourlyDistribution.sort((a, b) => a.hour - b.hour),
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
