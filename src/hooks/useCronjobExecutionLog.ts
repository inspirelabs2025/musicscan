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

// All scheduled cronjobs from config.toml with detailed descriptions
export const SCHEDULED_CRONJOBS = [
  { 
    name: 'bulk-poster-processor', 
    schedule: '*/10 * * * *', 
    description: 'Genereert album artwork posters voor de webshop. Verwerkt items uit de poster queue en maakt printklare designs.',
    category: 'Content Generatie',
    trackingTable: 'batch_processing_status', 
    trackingFilter: { process_type: 'poster_generation' } 
  },
  { 
    name: 'discogs-lp-crawler', 
    schedule: '0 * * * *', 
    description: 'Haalt nieuwe vinyl releases op van Discogs API. Zoekt naar releases van curated artists en voegt ze toe aan de import queue.',
    category: 'Data Import',
    trackingTable: 'discogs_import_log' 
  },
  { 
    name: 'latest-discogs-news', 
    schedule: '0 */3 * * *', 
    description: 'Genereert nieuwsartikelen over trending Discogs releases. Analyseert prijstrends en schrijft SEO-geoptimaliseerde content.',
    category: 'Content Generatie',
    trackingTable: 'news_generation_logs', 
    trackingFilter: { generation_type: 'discogs_news' } 
  },
  { 
    name: 'batch-blog-processor', 
    schedule: '*/10 * * * *', 
    description: 'Verwerkt de blog generatie queue. Maakt uitgebreide blogposts voor vinyl/CD releases met AI-gegenereerde content.',
    category: 'Content Generatie',
    trackingTable: 'batch_processing_status', 
    trackingFilter: { process_type: 'blog_generation' } 
  },
  { 
    name: 'indexnow-processor', 
    schedule: '*/15 * * * *', 
    description: 'Verwerkt URLs uit de IndexNow queue. Stuurt nieuwe/gewijzigde paginas naar zoekmachines voor snellere indexering.',
    category: 'SEO',
    trackingTable: 'indexnow_queue' 
  },
  { 
    name: 'sitemap-queue-processor', 
    schedule: '*/3 * * * *', 
    description: 'Regenereert sitemaps wanneer content wijzigt. Houdt XML sitemaps up-to-date voor optimale SEO crawling.',
    category: 'SEO',
    trackingTable: 'sitemap_regeneration_log' 
  },
  { 
    name: 'indexnow-cron', 
    schedule: '*/15 * * * *', 
    description: 'Batch verzending naar IndexNow API. Bundelt meerdere URLs en submit ze naar Bing, Yandex en andere zoekmachines.',
    category: 'SEO',
    trackingTable: 'indexnow_submissions' 
  },
  { 
    name: 'refresh-featured-photos', 
    schedule: '0 */6 * * *', 
    description: 'Ververst de materialized view voor uitgelichte fotos. Berekent trending fotos op basis van likes, views en recency.',
    category: 'Community'
  },
  { 
    name: 'daily-anecdote-generator', 
    schedule: '5 6 * * *', 
    description: 'Genereert een dagelijkse muziek anekdote met AI. Creëert interessante feitjes over artiesten, albums en muziekgeschiedenis.',
    category: 'Content Generatie',
    trackingTable: 'news_generation_logs', 
    trackingFilter: { generation_type: 'daily_anecdote' } 
  },
  { 
    name: 'generate-daily-music-history', 
    schedule: '0 5 * * *', 
    description: 'Schrijft "Op deze dag in de muziekgeschiedenis" artikelen. Haalt historische events op en genereert rijke content.',
    category: 'Content Generatie',
    trackingTable: 'news_generation_logs', 
    trackingFilter: { generation_type: 'music_history' } 
  },
  { 
    name: 'singles-batch-processor', 
    schedule: '*/15 * * * *', 
    description: 'Verwerkt singles/7" vinyl releases. Importeert metadata van Discogs en genereert productpaginas voor de webshop.',
    category: 'Data Import',
    trackingTable: 'batch_processing_status', 
    trackingFilter: { process_type: 'singles_batch' } 
  },
  { 
    name: 'artist-stories-batch-processor', 
    schedule: '*/20 * * * *', 
    description: 'Genereert uitgebreide artist stories. Maakt biografieën, discografieën en culturele impact analyses met AI.',
    category: 'Content Generatie',
    trackingTable: 'batch_processing_status', 
    trackingFilter: { process_type: 'artist_stories' } 
  },
  { 
    name: 'generate-llm-sitemap', 
    schedule: '0 4 * * *', 
    description: 'Maakt een speciale sitemap voor AI/LLM crawlers. Optimaliseert content structuur voor ChatGPT, Claude en andere AI systemen.',
    category: 'SEO'
  },
  { 
    name: 'auto-generate-keywords', 
    schedule: '30 3 * * *', 
    description: 'Analyseert content en genereert relevante SEO keywords. Verbetert zoekbaarheid door automatische tag-suggesties.',
    category: 'SEO'
  },
  { 
    name: 'generate-curated-artists', 
    schedule: '0 2 * * *', 
    description: 'Ontdekt en curated nieuwe interessante artiesten. Analyseert trends en voegt artiesten toe aan de crawl-lijst.',
    category: 'Data Import'
  },
  { 
    name: 'daily-artist-stories-generator', 
    schedule: '0 7 * * *', 
    description: 'Selecteert dagelijks artiesten voor story generatie. Prioriteert op basis van populariteit en ontbrekende content.',
    category: 'Content Generatie',
    trackingTable: 'news_generation_logs', 
    trackingFilter: { generation_type: 'artist_stories' } 
  },
  { 
    name: 'rss-news-rewriter', 
    schedule: '0 8,14,20 * * *', 
    description: 'Herschrijft externe muzieknieuws RSS feeds. Maakt unieke, SEO-vriendelijke versies van trending muzieknieuws.',
    category: 'Content Generatie',
    trackingTable: 'news_generation_logs', 
    trackingFilter: { generation_type: 'rss_rewrite' } 
  },
] as const;

export const useCronjobExecutionLog = () => {
  const queryClient = useQueryClient();

  // Fetch batch processing status
  const { data: batchStatus } = useQuery({
    queryKey: ['cronjob-batch-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_processing_status')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Fetch discogs import log stats
  const { data: discogsStats } = useQuery({
    queryKey: ['cronjob-discogs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discogs_import_log')
        .select('status, created_at, processed_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pending: data.filter(d => d.status === 'pending').length,
        completed: data.filter(d => d.status === 'completed').length,
        failed: data.filter(d => d.status === 'failed').length,
        lastRun: data[0]?.created_at || null,
      };
      return stats;
    },
    refetchInterval: 10000,
  });

  // Fetch sitemap regeneration stats
  const { data: sitemapStats } = useQuery({
    queryKey: ['cronjob-sitemap-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_regeneration_log')
        .select('status, created_at, processing_time_ms')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const successCount = data.filter(d => d.status === 'success').length;
      const avgTime = data.filter(d => d.processing_time_ms).reduce((acc, d) => acc + (d.processing_time_ms || 0), 0) / Math.max(1, data.filter(d => d.processing_time_ms).length);
      
      return {
        total: data.length,
        successful: successCount,
        failed: data.filter(d => d.status === 'failed').length,
        lastRun: data[0]?.created_at || null,
        lastStatus: data[0]?.status || null,
        avgExecutionTime: Math.round(avgTime),
      };
    },
    refetchInterval: 10000,
  });

  // Fetch news generation logs
  const { data: newsStats } = useQuery({
    queryKey: ['cronjob-news-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Group by generation_type
      const byType: Record<string, { total: number; success: number; lastRun: string | null; lastStatus: string | null }> = {};
      data.forEach(item => {
        const type = (item as any).generation_type || 'unknown';
        if (!byType[type]) {
          byType[type] = { total: 0, success: 0, lastRun: null, lastStatus: null };
        }
        byType[type].total++;
        if ((item as any).status === 'success' || (item as any).status === 'completed') {
          byType[type].success++;
        }
        if (!byType[type].lastRun) {
          byType[type].lastRun = item.created_at;
          byType[type].lastStatus = (item as any).status;
        }
      });
      
      return { byType, raw: data };
    },
    refetchInterval: 30000,
  });

  // Fetch indexnow stats
  const { data: indexnowStats } = useQuery({
    queryKey: ['cronjob-indexnow-stats'],
    queryFn: async () => {
      const { data: submissions, error: subError } = await supabase
        .from('indexnow_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50);
      
      const { data: queue, error: queueError } = await supabase
        .from('indexnow_queue')
        .select('processed, processed_at')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (subError) throw subError;
      if (queueError) throw queueError;
      
      return {
        submissions: {
          total: submissions?.length || 0,
          lastRun: submissions?.[0]?.submitted_at || null,
          success: submissions?.filter((s: any) => s.status_code >= 200 && s.status_code < 300).length || 0,
        },
        queue: {
          total: queue?.length || 0,
          processed: queue?.filter((q: any) => q.processed).length || 0,
          pending: queue?.filter((q: any) => !q.processed).length || 0,
          lastProcessed: queue?.find((q: any) => q.processed)?.processed_at || null,
        }
      };
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
      queryClient.invalidateQueries({ queryKey: ['cronjob-batch-status'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-discogs-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-sitemap-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-news-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-indexnow-stats'] });
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cronjob-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batch_processing_status' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-batch-status'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discogs_import_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-discogs-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sitemap_regeneration_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-sitemap-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'indexnow_queue' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-indexnow-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build combined stats for each cronjob
  const cronjobsWithStats = SCHEDULED_CRONJOBS.map(job => {
    let stats: CronjobStats | null = null;
    let recentExecutions: any[] = [];

    // Match stats based on tracking table and filter
    if (job.name === 'discogs-lp-crawler' && discogsStats) {
      stats = {
        function_name: job.name,
        total_runs: discogsStats.total,
        successful_runs: discogsStats.completed,
        failed_runs: discogsStats.failed,
        running_count: discogsStats.pending,
        avg_execution_time_ms: null,
        last_run_at: discogsStats.lastRun,
        last_status: discogsStats.completed > 0 ? 'success' : (discogsStats.failed > 0 ? 'error' : null),
      };
    }

    if (job.name === 'sitemap-queue-processor' && sitemapStats) {
      stats = {
        function_name: job.name,
        total_runs: sitemapStats.total,
        successful_runs: sitemapStats.successful,
        failed_runs: sitemapStats.failed,
        running_count: 0,
        avg_execution_time_ms: sitemapStats.avgExecutionTime,
        last_run_at: sitemapStats.lastRun,
        last_status: sitemapStats.lastStatus,
      };
    }

    if ((job.name === 'indexnow-processor' || job.name === 'indexnow-cron') && indexnowStats) {
      const isProcessor = job.name === 'indexnow-processor';
      stats = {
        function_name: job.name,
        total_runs: isProcessor ? indexnowStats.queue.total : indexnowStats.submissions.total,
        successful_runs: isProcessor ? indexnowStats.queue.processed : indexnowStats.submissions.success,
        failed_runs: 0,
        running_count: isProcessor ? indexnowStats.queue.pending : 0,
        avg_execution_time_ms: null,
        last_run_at: isProcessor ? indexnowStats.queue.lastProcessed : indexnowStats.submissions.lastRun,
        last_status: (isProcessor ? indexnowStats.queue.processed : indexnowStats.submissions.success) > 0 ? 'success' : null,
      };
    }

    if (job.name === 'batch-blog-processor' && batchStatus) {
      const blogBatch = batchStatus.find(b => b.process_type === 'blog_generation');
      if (blogBatch) {
        stats = {
          function_name: job.name,
          total_runs: blogBatch.processed_items || 0,
          successful_runs: blogBatch.successful_items || 0,
          failed_runs: blogBatch.failed_items || 0,
          running_count: blogBatch.status === 'running' ? 1 : 0,
          avg_execution_time_ms: null,
          last_run_at: blogBatch.updated_at,
          last_status: blogBatch.status === 'completed' ? 'success' : (blogBatch.status === 'running' ? 'running' : blogBatch.status),
        };
      }
    }

    if (job.name === 'bulk-poster-processor' && batchStatus) {
      const posterBatch = batchStatus.find(b => b.process_type === 'poster_generation');
      if (posterBatch) {
        stats = {
          function_name: job.name,
          total_runs: posterBatch.processed_items || 0,
          successful_runs: posterBatch.successful_items || 0,
          failed_runs: posterBatch.failed_items || 0,
          running_count: posterBatch.status === 'running' ? 1 : 0,
          avg_execution_time_ms: null,
          last_run_at: posterBatch.updated_at,
          last_status: posterBatch.status === 'completed' ? 'success' : (posterBatch.status === 'running' ? 'running' : posterBatch.status),
        };
      }
    }

    // News generation related cronjobs
    if (newsStats) {
      const typeMap: Record<string, string> = {
        'latest-discogs-news': 'discogs_news',
        'daily-anecdote-generator': 'daily_anecdote',
        'generate-daily-music-history': 'music_history',
        'daily-artist-stories-generator': 'artist_stories',
        'rss-news-rewriter': 'rss_rewrite',
      };
      
      const genType = typeMap[job.name];
      if (genType && newsStats.byType[genType]) {
        const typeStats = newsStats.byType[genType];
        stats = {
          function_name: job.name,
          total_runs: typeStats.total,
          successful_runs: typeStats.success,
          failed_runs: typeStats.total - typeStats.success,
          running_count: 0,
          avg_execution_time_ms: null,
          last_run_at: typeStats.lastRun,
          last_status: typeStats.lastStatus === 'success' || typeStats.lastStatus === 'completed' ? 'success' : typeStats.lastStatus,
        };
      }
    }

    return {
      ...job,
      stats,
      lastExecution: null,
    };
  });

  // Build recent activity from all sources
  const recentActivity: CronjobExecution[] = [];
  
  // Add sitemap logs as recent activity
  if (sitemapStats) {
    // We'd need to fetch the actual records for this, but for now let's rely on other sources
  }

  const isLoading = !batchStatus && !discogsStats && !sitemapStats;

  return {
    executions: recentActivity,
    stats: cronjobsWithStats.map(c => c.stats).filter(Boolean) as CronjobStats[],
    cronjobsWithStats,
    isLoading,
    triggerCronjob,
    // Raw data for debugging
    rawData: {
      batchStatus,
      discogsStats,
      sitemapStats,
      newsStats,
      indexnowStats,
    }
  };
};
