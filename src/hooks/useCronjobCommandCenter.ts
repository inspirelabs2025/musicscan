import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Complete list of all scheduled cronjobs from config.toml with categories
export const ALL_SCHEDULED_CRONJOBS = [
  // Content Generatie
  { name: 'daily-anecdote-generator', schedule: '5 6 * * *', description: 'Genereert dagelijkse muziek anekdotes met AI', category: 'Content Generatie', expectedIntervalMinutes: 1440 },
  { name: 'generate-daily-music-history', schedule: '0 6 * * *', description: 'Schrijft "Vandaag in de Muziekgeschiedenis" artikelen', category: 'Content Generatie', expectedIntervalMinutes: 1440 },
  { name: 'daily-artist-stories-generator', schedule: '0 1 * * *', description: 'Selecteert artiesten voor story generatie', category: 'Content Generatie', expectedIntervalMinutes: 1440 },
  { name: 'artist-stories-batch-processor', schedule: '* * * * *', description: 'Genereert artist stories (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1 },
  { name: 'singles-batch-processor', schedule: '* * * * *', description: 'Verwerkt singles queue (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1 },
  { name: 'batch-blog-processor', schedule: '*/10 * * * *', description: 'Genereert blog posts voor albums', category: 'Content Generatie', expectedIntervalMinutes: 10 },
  { name: 'latest-discogs-news', schedule: '0 3 * * *', description: 'Genereert nieuws over Discogs releases', category: 'Content Generatie', expectedIntervalMinutes: 1440 },
  { name: 'composer-batch-processor', schedule: '* * * * *', description: 'Verwerkt componist verhalen (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1 },
  { name: 'soundtrack-batch-processor', schedule: '* * * * *', description: 'Verwerkt soundtrack verhalen (1/min)', category: 'Content Generatie', expectedIntervalMinutes: 1 },
  
  // Data Import & Crawling
  { name: 'discogs-lp-crawler', schedule: '0 * * * *', description: 'Haalt nieuwe vinyl releases op van Discogs', category: 'Data Import', expectedIntervalMinutes: 60 },
  { name: 'process-discogs-queue', schedule: '*/2 * * * *', description: 'Verwerkt Discogs import queue', category: 'Data Import', expectedIntervalMinutes: 2 },
  { name: 'generate-curated-artists', schedule: '0 2 * * *', description: 'Ontdekt nieuwe interessante artiesten', category: 'Data Import', expectedIntervalMinutes: 1440 },
  { name: 'process-spotify-new-releases', schedule: '0 9 * * *', description: 'Haalt nieuwe Spotify releases op en verwerkt ze', category: 'Data Import', expectedIntervalMinutes: 1440 },
  { name: 'queue-dance-house-content', schedule: '0 7 * * *', description: 'Queue Dance/House content voor generatie', category: 'Data Import', expectedIntervalMinutes: 1440 },
  { name: 'top2000-auto-processor', schedule: '* * * * *', description: 'Verwerkt Top 2000 enrichment en analyse', category: 'Data Import', expectedIntervalMinutes: 1 },
  
  // Social Media Posting
  { name: 'schedule-music-history-posts', schedule: '5 6 * * *', description: 'Plant muziekgeschiedenis posts voor de dag', category: 'Social Media', expectedIntervalMinutes: 1440 },
  { name: 'post-scheduled-music-history', schedule: '0 8-22 * * *', description: 'Post muziekgeschiedenis naar Facebook (elk uur 8-22)', category: 'Social Media', expectedIntervalMinutes: 60 },
  { name: 'post-scheduled-singles', schedule: '30 9-21/2 * * *', description: 'Post singles naar Facebook (elke 2 uur)', category: 'Social Media', expectedIntervalMinutes: 120 },
  { name: 'post-scheduled-youtube', schedule: '0 9-21 * * *', description: 'Post YouTube discoveries naar Facebook', category: 'Social Media', expectedIntervalMinutes: 60 },
  
  // SEO & Indexing
  { name: 'indexnow-processor', schedule: '*/5 * * * *', description: 'Verwerkt URLs voor IndexNow submission', category: 'SEO', expectedIntervalMinutes: 5 },
  { name: 'indexnow-cron', schedule: '*/15 * * * *', description: 'Batch verzending naar IndexNow API', category: 'SEO', expectedIntervalMinutes: 15 },
  { name: 'sitemap-queue-processor', schedule: '*/3 * * * *', description: 'Regenereert sitemaps bij wijzigingen', category: 'SEO', expectedIntervalMinutes: 3 },
  { name: 'generate-static-sitemaps', schedule: '0 3 * * *', description: 'Genereert statische XML sitemaps', category: 'SEO', expectedIntervalMinutes: 1440 },
  { name: 'generate-llm-sitemap', schedule: '0 4 * * *', description: 'Maakt sitemap voor AI crawlers', category: 'SEO', expectedIntervalMinutes: 1440 },
  { name: 'auto-generate-keywords', schedule: '0 3 * * *', description: 'Genereert SEO keywords met AI', category: 'SEO', expectedIntervalMinutes: 1440 },
  
  // Product Generatie
  { name: 'bulk-poster-processor', schedule: '*/5 * * * *', description: 'Genereert poster designs voor webshop', category: 'Products', expectedIntervalMinutes: 5 },
  { name: 'backfill-christmas-socks', schedule: '*/2 * * * *', description: 'Genereert kerst sokken designs', category: 'Products', expectedIntervalMinutes: 2 },
  { name: 'repair-christmas-sock-images', schedule: '*/3 * * * *', description: 'Repareert kerst sok afbeeldingen', category: 'Products', expectedIntervalMinutes: 3 },
  
  // Maintenance & Community
  { name: 'refresh-featured-photos', schedule: '0 */6 * * *', description: 'Ververst uitgelichte community fotos', category: 'Community', expectedIntervalMinutes: 360 },
] as const;

export type CronjobCategory = 'Content Generatie' | 'Data Import' | 'Social Media' | 'SEO' | 'Products' | 'Community';

export interface QueueHealth {
  queue_name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  last_activity: string | null;
  oldest_pending: string | null;
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

export const useCronjobCommandCenter = () => {
  const queryClient = useQueryClient();

  // Fetch queue health from RPC
  const { data: queueHealth, isLoading: isLoadingQueues } = useQuery({
    queryKey: ['cronjob-queue-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_queue_health_overview');
      if (error) throw error;
      return (data || []) as QueueHealth[];
    },
    refetchInterval: 30000,
  });

  // Fetch cronjob health stats from RPC
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
      queryClient.invalidateQueries({ queryKey: ['cronjob-queue-health'] });
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
        queryClient.invalidateQueries({ queryKey: ['cronjob-queue-health'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Combine scheduled jobs with their health stats
  const cronjobsWithHealth = ALL_SCHEDULED_CRONJOBS.map(job => {
    const health = cronjobHealth?.find(h => h.function_name === job.name);
    const isOverdue = health?.last_run_at 
      ? (Date.now() - new Date(health.last_run_at).getTime()) > (job.expectedIntervalMinutes * 60 * 1000 * 1.5)
      : false;
    
    return {
      ...job,
      health,
      isOverdue,
      hasError: health?.last_status === 'error',
      isRunning: (health?.running_count || 0) > 0,
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

  // Queue stats
  const queueStats = {
    totalPending: queueHealth?.reduce((sum, q) => sum + (q.pending || 0), 0) || 0,
    totalFailed: queueHealth?.reduce((sum, q) => sum + (q.failed || 0), 0) || 0,
    totalProcessing: queueHealth?.reduce((sum, q) => sum + (q.processing || 0), 0) || 0,
  };

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
    ...(queueHealth?.filter(q => q.failed > 10) || []).map(q => ({
      type: 'error' as const,
      job: q.queue_name,
      message: `${q.failed} failed items in queue`,
      timestamp: q.last_activity,
    })),
  ];

  return {
    cronjobsWithHealth,
    cronjobsByCategory,
    queueHealth,
    recentExecutions,
    stats,
    queueStats,
    alerts,
    isLoading: isLoadingQueues || isLoadingHealth || isLoadingRecent,
    triggerCronjob,
  };
};
