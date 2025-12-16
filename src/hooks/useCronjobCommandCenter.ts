import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from "date-fns";

// Complete list of all scheduled cronjobs from config.toml with categories and exact times
// expectedPerDay overrides calculated value for time-window and weekly crons
// Mapping cronjob -> queue table (for pending items display)
export const CRONJOB_QUEUE_MAPPING: Record<string, { table: string; statusColumn?: string; pendingStatus?: string }> = {
  'artist-stories-batch-processor': { table: 'batch_queue_items', statusColumn: 'status', pendingStatus: 'pending' },
  'singles-batch-processor': { table: 'singles_import_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'post-scheduled-singles': { table: 'singles_facebook_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'post-scheduled-music-history': { table: 'music_history_facebook_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'post-scheduled-youtube': { table: 'youtube_facebook_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'process-podcast-facebook-queue': { table: 'podcast_facebook_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'indexnow-processor': { table: 'indexnow_queue', statusColumn: 'processed', pendingStatus: 'false' },
  'process-discogs-queue': { table: 'discogs_import_log', statusColumn: 'status', pendingStatus: 'pending' },
  'bulk-poster-processor': { table: 'photo_batch_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'process-tiktok-video-queue': { table: 'render_jobs', statusColumn: 'status', pendingStatus: 'pending' },
  'top2000-auto-processor': { table: 'top2000_songs', statusColumn: 'enriched_at', pendingStatus: 'null' },
  'backfill-christmas-socks': { table: 'christmas_import_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'composer-batch-processor': { table: 'batch_queue_items', statusColumn: 'status', pendingStatus: 'pending' },
  'soundtrack-batch-processor': { table: 'batch_queue_items', statusColumn: 'status', pendingStatus: 'pending' },
  'queue-dance-house-content': { table: 'singles_import_queue', statusColumn: 'status', pendingStatus: 'pending' },
  'process-spotify-new-releases': { table: 'spotify_new_releases_processed', statusColumn: 'status', pendingStatus: 'pending' },
};

export const ALL_SCHEDULED_CRONJOBS = [
  // Content Generatie
  { name: 'daily-anecdote-generator', schedule: '5 6 * * *', time: '06:05 UTC', description: 'Genereert dagelijkse muziek anekdotes met AI', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'music_anecdotes' },
  { name: 'generate-daily-music-history', schedule: '0 6 * * *', time: '06:00 UTC', description: 'Schrijft "Vandaag in de de Muziekgeschiedenis" artikelen', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'music_history_events' },
  { name: 'daily-artist-stories-generator', schedule: '0 1 * * *', time: '01:00 UTC', description: 'Selecteert artiesten voor story generatie', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'batch_queue_items' },
  { name: 'artist-stories-batch-processor', schedule: '* * * * *', time: 'Elke minuut', description: 'Genereert artist stories (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1, expectedPerDay: 1440, outputTable: 'artist_stories' },
  { name: 'singles-batch-processor', schedule: '* * * * *', time: 'Elke minuut', description: 'Verwerkt singles queue (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1, expectedPerDay: 1440, outputTable: 'music_stories' },
  { name: 'batch-blog-processor', schedule: '*/10 * * * *', time: 'Elke 10 min', description: 'Genereert blog posts voor albums', category: 'Content Generatie', expectedIntervalMinutes: 10, expectedPerDay: 144, outputTable: 'blog_posts' },
  { name: 'latest-discogs-news', schedule: '0 3 * * *', time: '03:00 UTC', description: 'Genereert nieuws over Discogs releases', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'news_blog_posts' },
  { name: 'composer-batch-processor', schedule: '* * * * *', time: 'Elke minuut', description: 'Verwerkt componist verhalen (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1, expectedPerDay: 1440, outputTable: 'music_stories' },
  { name: 'soundtrack-batch-processor', schedule: '* * * * *', time: 'Elke minuut', description: 'Verwerkt soundtrack verhalen (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1, expectedPerDay: 1440, outputTable: 'music_stories' },
  { name: 'generate-daily-challenge', schedule: '0 5 * * *', time: '05:00 UTC', description: 'Genereert dagelijkse quiz challenge', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'daily_challenges' },
  { name: 'daily-youtube-discoveries', schedule: '0 4 * * *', time: '04:00 UTC', description: 'Ontdekt nieuwe YouTube muziekvideo\'s', category: 'Content Generatie', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'youtube_discoveries' },

  // Data Import & Crawling
  { name: 'discogs-lp-crawler', schedule: '0 * * * *', time: 'Elk uur :00', description: 'Haalt nieuwe vinyl releases op van Discogs', category: 'Data Import', expectedIntervalMinutes: 60, expectedPerDay: 24, outputTable: 'discogs_import_log' },
  { name: 'process-discogs-queue', schedule: '*/2 * * * *', time: 'Elke 2 min', description: 'Maakt art products + blog posts van Discogs releases', category: 'Data Import', expectedIntervalMinutes: 2, expectedPerDay: 720, outputTable: 'platform_products' },
  { name: 'generate-curated-artists', schedule: '0 2 * * *', time: '02:00 UTC', description: 'Ontdekt nieuwe interessante artiesten', category: 'Data Import', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'curated_artists' },
  { name: 'process-spotify-new-releases', schedule: '0 9 * * *', time: '09:00 UTC', description: 'Haalt nieuwe Spotify releases op en verwerkt ze', category: 'Data Import', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'spotify_new_releases_processed' },
  { name: 'queue-dance-house-content', schedule: '0 7 * * *', time: '07:00 UTC', description: 'Queue Dance/House content voor generatie', category: 'Data Import', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'singles_import_queue' },
  { name: 'top2000-auto-processor', schedule: '* * * * *', time: 'Elke minuut', description: 'Verwerkt Top 2000 enrichment en analyse', category: 'Data Import', expectedIntervalMinutes: 1, expectedPerDay: 1440, outputTable: 'top2000_songs' },
  
  // Social Media Posting
  { name: 'schedule-music-history-posts', schedule: '5 6 * * *', time: '06:05 UTC', description: 'Plant muziekgeschiedenis posts voor de dag', category: 'Social Media', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'music_history_facebook_queue' },
  { name: 'post-scheduled-music-history', schedule: '0 8-22 * * *', time: '08:00-22:00 UTC (elk uur)', description: 'Post muziekgeschiedenis naar Facebook', category: 'Social Media', expectedIntervalMinutes: 60, expectedPerDay: 15, outputTable: 'music_history_facebook_queue' },
  { name: 'post-scheduled-singles', schedule: '30 9-21/2 * * *', time: '09:30-21:30 UTC (elke 2u)', description: 'Post singles naar Facebook', category: 'Social Media', expectedIntervalMinutes: 120, expectedPerDay: 7, outputTable: 'singles_facebook_queue' },
  { name: 'schedule-youtube-posts', schedule: '10 6 * * *', time: '06:10 UTC', description: 'Plant YouTube FB posts voor de dag', category: 'Social Media', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'youtube_facebook_queue' },
  { name: 'post-scheduled-youtube', schedule: '0 9-21 * * *', time: '09:00-21:00 UTC (elk uur)', description: 'Post YouTube discoveries naar Facebook', category: 'Social Media', expectedIntervalMinutes: 60, expectedPerDay: 13, outputTable: 'youtube_facebook_queue' },
  { name: 'process-podcast-facebook-queue', schedule: '0 8-22 * * *', time: '08:00-22:00 UTC (elk uur)', description: 'Post podcast episodes naar Facebook', category: 'Social Media', expectedIntervalMinutes: 60, expectedPerDay: 15, outputTable: 'podcast_facebook_queue' },
  { name: 'schedule-weekly-podcast-posts', schedule: '0 6 * * 1', time: 'Maandag 06:00 UTC', description: 'Plant wekelijkse podcast posts', category: 'Social Media', expectedIntervalMinutes: 10080, expectedPerDay: 0.14, isWeekly: true, outputTable: 'podcast_facebook_queue' },
  
  // SEO & Indexing
  { name: 'indexnow-processor', schedule: '*/5 * * * *', time: 'Elke 5 min', description: 'Verwerkt URLs voor IndexNow submission', category: 'SEO', expectedIntervalMinutes: 5, expectedPerDay: 288, outputTable: 'indexnow_queue' },
  { name: 'indexnow-cron', schedule: '*/15 * * * *', time: 'Elke 15 min', description: 'Batch verzending naar IndexNow API', category: 'SEO', expectedIntervalMinutes: 15, expectedPerDay: 96, outputTable: 'indexnow_submissions' },
  { name: 'sitemap-queue-processor', schedule: '*/3 * * * *', time: 'Elke 3 min', description: 'Regenereert sitemaps bij wijzigingen', category: 'SEO', expectedIntervalMinutes: 3, expectedPerDay: 480, outputTable: 'sitemap_logs' },
  { name: 'generate-static-sitemaps', schedule: '0 3 * * *', time: '03:00 UTC', description: 'Genereert statische XML sitemaps', category: 'SEO', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'sitemap_logs' },
  { name: 'generate-llm-sitemap', schedule: '0 4 * * *', time: '04:00 UTC', description: 'Maakt sitemap voor AI crawlers', category: 'SEO', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: 'sitemap_logs' },
  { name: 'auto-generate-keywords', schedule: '0 3 * * *', time: '03:00 UTC', description: 'Genereert SEO keywords met AI', category: 'SEO', expectedIntervalMinutes: 1440, expectedPerDay: 1, outputTable: null },
  
  // Product Generatie
  { name: 'bulk-poster-processor', schedule: '*/5 * * * *', time: 'Elke 5 min', description: 'Genereert poster designs voor webshop', category: 'Products', expectedIntervalMinutes: 5, expectedPerDay: 288, outputTable: 'platform_products' },
  { name: 'backfill-christmas-socks', schedule: '*/2 * * * *', time: 'Elke 2 min', description: 'Genereert kerst sokken designs', category: 'Products', expectedIntervalMinutes: 2, expectedPerDay: 720, outputTable: 'album_socks' },
  { name: 'repair-christmas-sock-images', schedule: '*/3 * * * *', time: 'Elke 3 min', description: 'Repareert kerst sok afbeeldingen', category: 'Products', expectedIntervalMinutes: 3, expectedPerDay: 480, outputTable: 'album_socks' },
  { name: 'process-tiktok-video-queue', schedule: '*/5 * * * *', time: 'Elke 5 min', description: 'Verwerkt TikTok/GIF render queue', category: 'Products', expectedIntervalMinutes: 5, expectedPerDay: 288, outputTable: 'render_jobs' },
  
  // Maintenance & Community
  { name: 'refresh-featured-photos', schedule: '0 */6 * * *', time: 'Elke 6 uur :00', description: 'Ververst uitgelichte community fotos', category: 'Community', expectedIntervalMinutes: 360, expectedPerDay: 4, outputTable: 'photos' },
  { name: 'weekly-forum-discussions', schedule: '0 10 * * 1', time: 'Maandag 10:00 UTC', description: 'Genereert wekelijkse forum discussies', category: 'Community', expectedIntervalMinutes: 10080, expectedPerDay: 0.14, isWeekly: true, outputTable: 'forum_topics' },
] as const;

export type CronjobCategory = 'Content Generatie' | 'Data Import' | 'Social Media' | 'SEO' | 'Products' | 'Community';

export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

export interface OutputStatRow {
  content_type: string;
  date_bucket: string;
  items_created: number;
  items_posted: number;
  items_failed: number;
}

export interface OutputTotals {
  total_created: number;
  total_posted: number;
  total_in_queue: number;
  total_failed: number;
}

export interface QueueStat {
  queue_name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  oldest_pending_at: string | null;
  last_activity_at: string | null;
  items_per_hour: number | null;
}

export interface CronjobHealth {
  function_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  running_count: number;
  avg_execution_time_ms: number | null;
  last_run_at: string | null;
  last_status: string | null;
  success_rate: number | null;
}

export interface RecentExecution {
  id: string;
  function_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  execution_time_ms: number | null;
  items_processed: number | null;
  error_message: string | null;
}

// Content type label mapping
const CONTENT_TYPE_LABELS: Record<string, string> = {
  'artist_stories': 'Artist Stories',
  'music_stories': 'Singles',
  'music_anecdotes': 'Anekdotes',
  'news_blog_posts': 'Nieuws',
  'music_history_events': 'Muziekgeschiedenis',
  'platform_products': 'Producten',
  'indexnow_submissions': 'IndexNow URLs',
  'fb_music_history': 'FB: Muziekgeschiedenis',
  'fb_singles': 'FB: Singles',
  'fb_youtube': 'FB: YouTube',
};

// Helper to get date range from preset
export const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now), preset };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday), preset };
    case 'this_week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now), preset };
    case 'last_week':
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      return { start: lastWeekStart, end: lastWeekEnd, preset };
    default:
      return { start: startOfDay(now), end: endOfDay(now), preset: 'today' };
  }
};

// Get comparison date range (previous period)
export const getComparisonDateRange = (current: DateRange): DateRange => {
  const daysDiff = Math.ceil((current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24));
  return {
    start: subDays(current.start, daysDiff),
    end: subDays(current.end, daysDiff),
    preset: 'custom',
  };
};

export const useCronjobCommandCenter = (dateRange: DateRange) => {
  const queryClient = useQueryClient();

  // Fetch detailed output statistics from result tables
  const { data: outputStatsRaw, isLoading: isLoadingOutput } = useQuery({
    queryKey: ['cronjob-output-stats', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cronjob_output_stats', {
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return (data || []) as OutputStatRow[];
    },
    refetchInterval: 60000,
  });

  // Fetch output totals - FIX: extract from array
  const { data: outputTotals } = useQuery({
    queryKey: ['cronjob-output-totals', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_output_totals', {
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      // RPC returns array, extract first element
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      return result as OutputTotals | null;
    },
    refetchInterval: 60000,
  });

  // Fetch comparison output statistics (previous period)
  const comparisonRange = getComparisonDateRange(dateRange);
  const { data: comparisonStatsRaw } = useQuery({
    queryKey: ['cronjob-output-stats-comparison', format(comparisonRange.start, 'yyyy-MM-dd'), format(comparisonRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cronjob_output_stats', {
        p_start_date: format(comparisonRange.start, 'yyyy-MM-dd'),
        p_end_date: format(comparisonRange.end, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return (data || []) as OutputStatRow[];
    },
    refetchInterval: 60000,
  });

  // Fetch comparison totals - FIX: extract from array
  const { data: comparisonTotals } = useQuery({
    queryKey: ['cronjob-output-totals-comparison', format(comparisonRange.start, 'yyyy-MM-dd'), format(comparisonRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_output_totals', {
        p_start_date: format(comparisonRange.start, 'yyyy-MM-dd'),
        p_end_date: format(comparisonRange.end, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      // RPC returns array, extract first element
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      return result as OutputTotals | null;
    },
    refetchInterval: 60000,
  });

  // Fetch queue health
  const { data: queueStats, isLoading: isLoadingQueues } = useQuery({
    queryKey: ['cronjob-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_queue_stats');
      if (error) throw error;
      return (data || []) as QueueStat[];
    },
    refetchInterval: 30000,
  });

  // Fetch cronjob last output from content tables (actual activity)
  const { data: cronjobLastOutput } = useQuery({
    queryKey: ['cronjob-last-output'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cronjob_last_output');
      if (error) throw error;
      return (data || []) as { cronjob_name: string; output_table: string; last_output_at: string | null; items_today: number }[];
    },
    refetchInterval: 30000,
  });

  // Fetch queue pending counts per cronjob
  const { data: queuePendingData } = useQuery({
    queryKey: ['cronjob-queue-pending'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cronjob_queue_pending');
      if (error) throw error;
      return (data || []) as { cronjob_name: string; queue_table: string; pending_count: number }[];
    },
    refetchInterval: 15000,
  });

  // Create lookup map for queue pending counts
  const queuePendingMap = useMemo(() => {
    const map: Record<string, { table: string; pending: number }> = {};
    queuePendingData?.forEach(item => {
      map[item.cronjob_name] = { table: item.queue_table, pending: item.pending_count };
    });
    return map;
  }, [queuePendingData]);

  // Fetch cronjob health stats from execution log (may be empty)
  const { data: cronjobHealth, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['cronjob-health-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cronjob_health_stats', { p_hours: 24 });
      if (error) throw error;
      return (data || []) as CronjobHealth[];
    },
    refetchInterval: 30000,
  });

  // Fetch recent executions
  const { data: recentExecutions, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['cronjob-recent-executions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_cronjob_executions', { p_limit: 100 });
      if (error) throw error;
      return (data || []) as RecentExecution[];
    },
    refetchInterval: 15000,
  });

  // Manual trigger mutation
  const triggerCronjob = useMutation({
    mutationFn: async (functionName: string) => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { manual: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronjob-output-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-health-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-recent-executions'] });
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cronjob-command-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cronjob_execution_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-health-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cronjob-recent-executions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batch_queue_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-queue-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Aggregate output stats by content type
  const outputStats = useMemo(() => {
    if (!outputStatsRaw) return [];
    
    // Group by content_type and sum
    const grouped = outputStatsRaw.reduce((acc, row) => {
      if (!acc[row.content_type]) {
        acc[row.content_type] = { created: 0, posted: 0, failed: 0 };
      }
      acc[row.content_type].created += row.items_created;
      acc[row.content_type].posted += row.items_posted;
      acc[row.content_type].failed += row.items_failed;
      return acc;
    }, {} as Record<string, { created: number; posted: number; failed: number }>);

    // Same for comparison
    const comparisonGrouped = (comparisonStatsRaw || []).reduce((acc, row) => {
      if (!acc[row.content_type]) {
        acc[row.content_type] = { created: 0, posted: 0, failed: 0 };
      }
      acc[row.content_type].created += row.items_created;
      acc[row.content_type].posted += row.items_posted;
      acc[row.content_type].failed += row.items_failed;
      return acc;
    }, {} as Record<string, { created: number; posted: number; failed: number }>);

    return Object.entries(grouped).map(([content_type, totals]) => {
      const previous = comparisonGrouped[content_type] || { created: 0, posted: 0, failed: 0 };
      const diff = totals.created - previous.created;
      const percentChange = previous.created > 0 
        ? Math.round(((totals.created - previous.created) / previous.created) * 100)
        : totals.created > 0 ? 100 : 0;

      return {
        content_type,
        label: CONTENT_TYPE_LABELS[content_type] || content_type,
        total_created: totals.created,
        total_posted: totals.posted,
        total_failed: totals.failed,
        previous_created: previous.created,
        diff,
        percentChange,
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      };
    }).sort((a, b) => b.total_created - a.total_created);
  }, [outputStatsRaw, comparisonStatsRaw]);

  // Combine scheduled jobs with their health stats AND output activity
  const cronjobsWithHealth = ALL_SCHEDULED_CRONJOBS.map(job => {
    const health = cronjobHealth?.find(h => h.function_name === job.name);
    const lastOutput = cronjobLastOutput?.find(o => o.cronjob_name === job.name);
    
    // Use last_output_at from content tables if available, fallback to execution log
    const lastActivityTime = lastOutput?.last_output_at || health?.last_run_at;
    const itemsToday = lastOutput?.items_today || 0;
    
    const isOverdue = lastActivityTime 
      ? (Date.now() - new Date(lastActivityTime).getTime()) > (job.expectedIntervalMinutes * 60 * 1000 * 1.5)
      : false;
    
    // Determine status based on actual output activity
    const hasRecentOutput = lastActivityTime 
      ? (Date.now() - new Date(lastActivityTime).getTime()) < (job.expectedIntervalMinutes * 60 * 1000 * 2)
      : false;
    
    return {
      ...job,
      health,
      lastOutput,
      lastActivityTime,
      itemsToday,
      isOverdue,
      hasError: health?.last_status === 'error',
      isRunning: (health?.running_count || 0) > 0,
      hasRecentOutput,
    };
  });

  // Group by category
  const cronjobsByCategory = ALL_SCHEDULED_CRONJOBS.reduce((acc, job) => {
    if (!acc[job.category]) acc[job.category] = [];
    acc[job.category].push(cronjobsWithHealth.find(j => j.name === job.name)!);
    return acc;
  }, {} as Record<CronjobCategory, typeof cronjobsWithHealth>);

  // Calculate overview stats
  const stats = {
    totalJobs: ALL_SCHEDULED_CRONJOBS.length,
    activeJobs: cronjobsWithHealth.filter(j => j.isRunning).length,
    healthyJobs: cronjobsWithHealth.filter(j => j.health?.last_status === 'success').length,
    errorJobs: cronjobsWithHealth.filter(j => j.hasError).length,
    overdueJobs: cronjobsWithHealth.filter(j => j.isOverdue).length,
    neverRan: cronjobsWithHealth.filter(j => !j.health).length,
  };

  // Queue summary stats
  const queueSummary = useMemo(() => ({
    totalPending: queueStats?.reduce((sum, q) => sum + (q.pending || 0), 0) || 0,
    totalFailed: queueStats?.reduce((sum, q) => sum + (q.failed || 0), 0) || 0,
    totalProcessing: queueStats?.reduce((sum, q) => sum + (q.processing || 0), 0) || 0,
    totalCompleted: queueStats?.reduce((sum, q) => sum + (q.completed || 0), 0) || 0,
  }), [queueStats]);

  // Total output for the period (from get_output_totals)
  const totalOutput = useMemo(() => ({
    created: outputTotals?.total_created || 0,
    posted: outputTotals?.total_posted || 0,
    inQueue: outputTotals?.total_in_queue || 0,
    failed: outputTotals?.total_failed || 0,
    previousCreated: comparisonTotals?.total_created || 0,
  }), [outputTotals, comparisonTotals]);

  // Alerts
  const alerts = [
    ...cronjobsWithHealth.filter(j => j.hasError).map(j => ({
      type: 'error' as const,
      job: j.name,
      message: `Laatste run gefaald`,
      timestamp: j.health?.last_run_at,
    })),
    ...cronjobsWithHealth.filter(j => j.isOverdue && !j.hasError).map(j => ({
      type: 'warning' as const,
      job: j.name,
      message: `Overdue - verwacht elke ${j.expectedIntervalMinutes} min`,
      timestamp: j.health?.last_run_at,
    })),
    ...(queueStats?.filter(q => q.failed > 10) || []).map(q => ({
      type: 'error' as const,
      job: q.queue_name,
      message: `${q.failed} failed items in queue`,
      timestamp: q.last_activity_at,
    })),
  ];

  return {
    // Date range info
    dateRange,
    comparisonRange,
    
    // Output statistics
    outputStats,
    totalOutput,
    
    // Queue statistics
    queueStats,
    queueSummary,
    queuePendingMap,
    
    // Cronjob health
    cronjobsWithHealth,
    cronjobsByCategory,
    cronjobHealth,
    recentExecutions,
    
    // Overview stats
    stats,
    alerts,
    
    // Loading states
    isLoading: isLoadingOutput || isLoadingQueues || isLoadingHealth || isLoadingRecent,
    
    // Actions
    triggerCronjob,
  };
};
