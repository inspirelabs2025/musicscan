import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface CronjobExecution {
  id: string;
  function_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'error';
  execution_time_ms: number | null;
  items_processed: number | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CronjobStats {
  function_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  running_count: number;
  avg_execution_time_ms: number | null;
  last_run_at: string | null;
  last_status: string | null;
}

// All scheduled cronjobs from config.toml
export const SCHEDULED_CRONJOBS = [
  { name: 'bulk-poster-processor', schedule: '*/10 * * * *', description: 'Verwerkt poster queue elke 10 minuten' },
  { name: 'discogs-lp-crawler', schedule: '0 * * * *', description: 'Crawlt Discogs LP releases elk uur' },
  { name: 'latest-discogs-news', schedule: '0 */3 * * *', description: 'Haalt laatste Discogs nieuws elke 3 uur' },
  { name: 'batch-blog-processor', schedule: '*/10 * * * *', description: 'Verwerkt blog batch elke 10 minuten' },
  { name: 'indexnow-processor', schedule: '*/15 * * * *', description: 'Verwerkt IndexNow queue elke 15 minuten' },
  { name: 'sitemap-queue-processor', schedule: '*/3 * * * *', description: 'Verwerkt sitemap queue elke 3 minuten' },
  { name: 'indexnow-cron', schedule: '*/15 * * * *', description: 'IndexNow cron elke 15 minuten' },
  { name: 'refresh-featured-photos', schedule: '0 */6 * * *', description: 'Refresht featured photos elke 6 uur' },
  { name: 'daily-anecdote-generator', schedule: '5 6 * * *', description: 'Genereert dagelijkse anekdote om 06:05 UTC' },
  { name: 'generate-daily-music-history', schedule: '0 5 * * *', description: 'Genereert dagelijkse muziek historie om 05:00 UTC' },
  { name: 'singles-batch-processor', schedule: '*/15 * * * *', description: 'Verwerkt singles batch elke 15 minuten' },
  { name: 'artist-stories-batch-processor', schedule: '*/20 * * * *', description: 'Verwerkt artist stories elke 20 minuten' },
  { name: 'generate-llm-sitemap', schedule: '0 4 * * *', description: 'Genereert LLM sitemap om 04:00 UTC' },
  { name: 'auto-generate-keywords', schedule: '30 3 * * *', description: 'Auto-genereert keywords om 03:30 UTC' },
  { name: 'generate-curated-artists', schedule: '0 2 * * *', description: 'Genereert curated artists om 02:00 UTC' },
  { name: 'daily-artist-stories-generator', schedule: '0 7 * * *', description: 'Genereert dagelijkse artist stories om 07:00 UTC' },
  { name: 'rss-news-rewriter', schedule: '0 8,14,20 * * *', description: 'Herschrijft RSS nieuws 3x per dag' },
] as const;

export const useCronjobExecutionLog = () => {
  const queryClient = useQueryClient();

  // Fetch recent executions
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['cronjob-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronjob_execution_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as CronjobExecution[];
    },
    refetchInterval: 10000,
  });

  // Fetch stats per cronjob
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cronjob-stats'],
    queryFn: async () => {
      // Calculate stats manually since we can't access the view directly
      const { data, error } = await supabase
        .from('cronjob_execution_log')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by function_name and calculate stats
      const statsMap = new Map<string, CronjobStats>();
      
      data.forEach((execution: CronjobExecution) => {
        const existing = statsMap.get(execution.function_name);
        if (!existing) {
          statsMap.set(execution.function_name, {
            function_name: execution.function_name,
            total_runs: 1,
            successful_runs: execution.status === 'success' ? 1 : 0,
            failed_runs: execution.status === 'error' ? 1 : 0,
            running_count: execution.status === 'running' ? 1 : 0,
            avg_execution_time_ms: execution.execution_time_ms,
            last_run_at: execution.started_at,
            last_status: execution.status,
          });
        } else {
          existing.total_runs++;
          if (execution.status === 'success') existing.successful_runs++;
          if (execution.status === 'error') existing.failed_runs++;
          if (execution.status === 'running') existing.running_count++;
          if (execution.execution_time_ms) {
            existing.avg_execution_time_ms = existing.avg_execution_time_ms
              ? Math.round((existing.avg_execution_time_ms + execution.execution_time_ms) / 2)
              : execution.execution_time_ms;
          }
        }
      });
      
      return Array.from(statsMap.values());
    },
    refetchInterval: 30000,
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
      queryClient.invalidateQueries({ queryKey: ['cronjob-executions'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-stats'] });
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cronjob-log-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cronjob_execution_log'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cronjob-executions'] });
          queryClient.invalidateQueries({ queryKey: ['cronjob-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Combine scheduled jobs with their stats
  const cronjobsWithStats = SCHEDULED_CRONJOBS.map(job => {
    const jobStats = stats?.find(s => s.function_name === job.name);
    return {
      ...job,
      stats: jobStats || null,
      lastExecution: executions?.find(e => e.function_name === job.name) || null,
    };
  });

  return {
    executions,
    stats,
    cronjobsWithStats,
    isLoading: executionsLoading || statsLoading,
    triggerCronjob,
  };
};
