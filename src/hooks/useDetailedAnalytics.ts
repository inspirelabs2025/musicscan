import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsOverview {
  total_views: number;
  unique_sessions: number;
  admin_views: number;
  facebook_views: number;
  google_views: number;
  direct_views: number;
  avg_views_per_day: number;
}

export interface TrafficSource {
  source_name: string;
  view_count: number;
  unique_sessions: number;
  percentage: number;
}

export interface ContentCategory {
  category: string;
  view_count: number;
  unique_sessions: number;
}

export interface HourlyTraffic {
  hour_of_day: number;
  view_count: number;
}

export interface DailyTraffic {
  date: string;
  total_views: number;
  unique_sessions: number;
  from_facebook: number;
}

export interface DeviceBreakdown {
  device_type: string;
  view_count: number;
  percentage: number;
}

export interface PageviewStat {
  path: string;
  page_title: string | null;
  view_count: number;
  unique_sessions: number;
  from_facebook: number;
  from_google: number;
  from_direct: number;
}

export const useAnalyticsOverview = (days: number = 7) => {
  return useQuery({
    queryKey: ['analytics-overview', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_overview', { p_days: days });
      if (error) throw error;
      return (data?.[0] || {}) as AnalyticsOverview;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useTrafficSources = (days: number = 7) => {
  return useQuery({
    queryKey: ['traffic-sources', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_traffic_sources_stats', { p_days: days });
      if (error) throw error;
      return (data || []) as TrafficSource[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useContentCategories = (days: number = 7) => {
  return useQuery({
    queryKey: ['content-categories', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_content_category_stats', { p_days: days });
      if (error) throw error;
      return (data || []) as ContentCategory[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useHourlyTraffic = (days: number = 7) => {
  return useQuery({
    queryKey: ['hourly-traffic', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_hourly_traffic', { p_days: days });
      if (error) throw error;
      return (data || []) as HourlyTraffic[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useDailyTraffic = (days: number = 30) => {
  return useQuery({
    queryKey: ['daily-traffic', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_traffic_trend', { p_days: days });
      if (error) throw error;
      return (data || []) as DailyTraffic[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeviceBreakdown = (days: number = 7) => {
  return useQuery({
    queryKey: ['device-breakdown', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_device_breakdown', { p_days: days });
      if (error) throw error;
      return (data || []) as DeviceBreakdown[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useFilteredPageviews = (days: number = 7) => {
  return useQuery({
    queryKey: ['filtered-pageviews', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_filtered_pageview_stats', { p_days: days });
      if (error) throw error;
      return (data || []) as PageviewStat[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useFacebookPostStats = () => {
  return useQuery({
    queryKey: ['facebook-post-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_post_log')
        .select('content_type, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by content type
      const byType: Record<string, number> = {};
      data?.forEach(post => {
        const type = post.content_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      return {
        total: data?.length || 0,
        byType,
        recentPosts: data?.slice(0, 10) || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useGrowthMetrics = () => {
  return useQuery({
    queryKey: ['growth-metrics'],
    queryFn: async () => {
      // Get various growth metrics
      const [profilesResult, storiesResult, productsResult, ordersResult, subscribersResult] = await Promise.all([
        supabase.from('profiles').select('created_at', { count: 'exact' }),
        supabase.from('music_stories').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('platform_products').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('platform_orders').select('id', { count: 'exact' }),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact' }).eq('is_confirmed', true),
      ]);
      
      return {
        totalUsers: profilesResult.count || 0,
        totalStories: storiesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalSubscribers: subscribersResult.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
