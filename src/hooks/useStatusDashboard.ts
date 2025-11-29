import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProcessStatus {
  name: string;
  label: string;
  expectedRuns: number;
  actualRuns: number;
  successful: number;
  failed: number;
  items: number;
  status: 'ok' | 'warning' | 'error';
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface NewsGenStats {
  source: string;
  runs: number;
  success: number;
  items: number;
  lastError?: string;
}

export interface ContentStats {
  blogs: number;
  musicStories: number;
  artistStories: number;
  news: number;
  anecdotes: number;
  musicHistory: number;
  youtube: number;
  spotify: number;
  singles: number;
  discogs: number;
  indexNow: number;
  cronjobs: number;
}

export interface TotalStats {
  totalNews: number;
  totalAnecdotes: number;
  totalMusicHistory: number;
  totalYouTube: number;
  totalSpotify: number;
}

const EXPECTED_DAILY_PROCESSES = [
  { name: 'daily-anecdote-generator', label: 'Anekdote Generator', expectedRuns: 1 },
  { name: 'generate-daily-music-history', label: 'Muziekgeschiedenis', expectedRuns: 1 },
  { name: 'rss-news-rewriter', label: 'RSS Nieuws', expectedRuns: 2 },
  { name: 'process-spotify-new-releases', label: 'Spotify Releases', expectedRuns: 2 },
  { name: 'singles-batch-processor', label: 'Singles Processor', expectedRuns: 24 },
  { name: 'artist-stories-batch-processor', label: 'Artist Stories', expectedRuns: 4 },
  { name: 'batch-blog-processor', label: 'Blog Processor', expectedRuns: 12 },
  { name: 'discogs-lp-crawler', label: 'Discogs LP Crawler', expectedRuns: 6 },
  { name: 'latest-discogs-news', label: 'Discogs News', expectedRuns: 8 },
  { name: 'indexnow-cron', label: 'IndexNow', expectedRuns: 6 },
  { name: 'refresh-featured-photos', label: 'Featured Photos', expectedRuns: 2 },
  { name: 'generate-curated-artists', label: 'Curated Artists', expectedRuns: 1 },
];

export const useStatusDashboard = (periodHours: number = 8) => {
  const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

  // Cronjob stats
  const { data: cronjobStats, isLoading: cronjobLoading, refetch: refetchCronjobs } = useQuery({
    queryKey: ['status-cronjobs', periodStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronjob_execution_log')
        .select('function_name, status, items_processed, execution_time_ms, error_message')
        .gte('started_at', periodStart)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const summary: Record<string, { runs: number; successful: number; failed: number; items: number; avgTime: number; errors: string[] }> = {};
      
      for (const log of data || []) {
        if (!summary[log.function_name]) {
          summary[log.function_name] = { runs: 0, successful: 0, failed: 0, items: 0, avgTime: 0, errors: [] };
        }
        const s = summary[log.function_name];
        s.runs++;
        if (log.status === 'completed' || log.status === 'success') {
          s.successful++;
        } else if (log.status === 'failed' || log.status === 'error') {
          s.failed++;
          if (log.error_message) s.errors.push(log.error_message);
        }
        s.items += log.items_processed || 0;
        s.avgTime += log.execution_time_ms || 0;
      }

      for (const key in summary) {
        if (summary[key].runs > 0) {
          summary[key].avgTime = Math.round(summary[key].avgTime / summary[key].runs);
        }
      }

      return { raw: data, summary };
    },
    staleTime: 30000,
  });

  // Process status based on cronjob summary
  const processStatus: ProcessStatus[] = EXPECTED_DAILY_PROCESSES.map(proc => {
    const stats = cronjobStats?.summary[proc.name];
    const actualRuns = stats?.runs || 0;
    const expectedInPeriod = Math.ceil(proc.expectedRuns / (24 / periodHours));
    const status = actualRuns >= expectedInPeriod ? 'ok' : actualRuns > 0 ? 'warning' : 'error';
    return {
      ...proc,
      actualRuns,
      expectedRuns: expectedInPeriod,
      successful: stats?.successful || 0,
      failed: stats?.failed || 0,
      items: stats?.items || 0,
      status
    };
  });

  // Singles queue
  const { data: singlesQueue, isLoading: singlesLoading } = useQuery({
    queryKey: ['status-singles-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('singles_import_queue')
        .select('status');
      
      if (error) throw error;
      
      const counts: QueueStats = { pending: 0, processing: 0, completed: 0, failed: 0 };
      for (const item of data || []) {
        if (item.status in counts) {
          counts[item.status as keyof QueueStats]++;
        }
      }
      return counts;
    },
    staleTime: 30000,
  });

  // Discogs queue
  const { data: discogsQueue, isLoading: discogsLoading } = useQuery({
    queryKey: ['status-discogs-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discogs_import_log')
        .select('status');
      
      if (error) throw error;
      
      const counts: QueueStats = { pending: 0, processing: 0, completed: 0, failed: 0 };
      for (const item of data || []) {
        const status = item.status as string;
        if (status in counts) {
          counts[status as keyof QueueStats]++;
        }
      }
      return counts;
    },
    staleTime: 30000,
  });

  // Content stats for period
  const { data: contentStats, isLoading: contentLoading, refetch: refetchContent } = useQuery({
    queryKey: ['status-content', periodStart],
    queryFn: async () => {
      const [blogs, musicStories, artistStories, news, anecdotes, musicHistory, youtube, spotify, singles, discogs, indexNow] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('music_stories').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('artist_stories').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('news_blog_posts').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('music_anecdotes').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('music_history_events').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('youtube_discoveries').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('spotify_new_releases_processed').select('*', { count: 'exact', head: true }).gte('created_at', periodStart),
        supabase.from('singles_import_queue').select('*', { count: 'exact', head: true }).in('status', ['completed', 'failed']).gte('processed_at', periodStart),
        supabase.from('discogs_import_log').select('*', { count: 'exact', head: true }).gte('processed_at', periodStart),
        supabase.from('indexnow_submissions').select('*', { count: 'exact', head: true }).gte('submitted_at', periodStart),
      ]);

      return {
        blogs: blogs.count || 0,
        musicStories: musicStories.count || 0,
        artistStories: artistStories.count || 0,
        news: news.count || 0,
        anecdotes: anecdotes.count || 0,
        musicHistory: musicHistory.count || 0,
        youtube: youtube.count || 0,
        spotify: spotify.count || 0,
        singles: singles.count || 0,
        discogs: discogs.count || 0,
        indexNow: indexNow.count || 0,
        cronjobs: cronjobStats?.raw?.length || 0,
      };
    },
    staleTime: 30000,
  });

  // Total stats
  const { data: totalStats, isLoading: totalsLoading } = useQuery({
    queryKey: ['status-totals'],
    queryFn: async () => {
      const [news, anecdotes, musicHistory, youtube, spotify] = await Promise.all([
        supabase.from('news_blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('music_anecdotes').select('*', { count: 'exact', head: true }),
        supabase.from('music_history_events').select('*', { count: 'exact', head: true }),
        supabase.from('youtube_discoveries').select('*', { count: 'exact', head: true }),
        supabase.from('spotify_new_releases_processed').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalNews: news.count || 0,
        totalAnecdotes: anecdotes.count || 0,
        totalMusicHistory: musicHistory.count || 0,
        totalYouTube: youtube.count || 0,
        totalSpotify: spotify.count || 0,
      };
    },
    staleTime: 60000,
  });

  // News generation logs
  const { data: newsGenStats, isLoading: newsGenLoading } = useQuery({
    queryKey: ['status-news-gen', periodStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_generation_logs')
        .select('source, status, items_generated, error_message')
        .gte('created_at', periodStart);

      if (error) throw error;

      const summary: Record<string, NewsGenStats> = {};
      for (const log of data || []) {
        if (!summary[log.source]) {
          summary[log.source] = { source: log.source, runs: 0, success: 0, items: 0 };
        }
        summary[log.source].runs++;
        if (log.status === 'success' || log.status === 'completed') {
          summary[log.source].success++;
          summary[log.source].items += log.items_generated || 0;
        } else if (log.error_message) {
          summary[log.source].lastError = log.error_message;
        }
      }

      return Object.values(summary);
    },
    staleTime: 30000,
  });

  // News cache status
  const { data: newsCache, isLoading: newsCacheLoading } = useQuery({
    queryKey: ['status-news-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_cache')
        .select('source, cached_at, expires_at');

      if (error) throw error;

      return (data || []).map(item => ({
        source: item.source,
        lastCached: new Date(item.cached_at),
        isExpired: new Date(item.expires_at) < new Date(),
      }));
    },
    staleTime: 30000,
  });

  // Batch queue stats
  const { data: batchQueue, isLoading: batchLoading } = useQuery({
    queryKey: ['status-batch-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_queue_items')
        .select('item_type, status');

      if (error) throw error;

      const byType: Record<string, QueueStats> = {};
      for (const item of data || []) {
        if (!byType[item.item_type]) {
          byType[item.item_type] = { pending: 0, processing: 0, completed: 0, failed: 0 };
        }
        if (item.status in byType[item.item_type]) {
          byType[item.item_type][item.status as keyof QueueStats]++;
        }
      }
      return byType;
    },
    staleTime: 30000,
  });

  const hasIssues = processStatus.some(p => p.status === 'error') ||
                    (singlesQueue?.failed || 0) > 0 ||
                    Object.values(cronjobStats?.summary || {}).some(s => s.failed > 0);

  const refetchAll = () => {
    refetchCronjobs();
    refetchContent();
  };

  return {
    processStatus,
    singlesQueue,
    discogsQueue,
    contentStats,
    totalStats,
    newsGenStats,
    newsCache,
    batchQueue,
    cronjobSummary: cronjobStats?.summary,
    cronjobRaw: cronjobStats?.raw,
    hasIssues,
    isLoading: cronjobLoading || singlesLoading || discogsLoading || contentLoading || totalsLoading || newsGenLoading || newsCacheLoading || batchLoading,
    refetch: refetchAll,
    periodHours,
  };
};
