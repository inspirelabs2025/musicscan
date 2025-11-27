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

  // Fetch sitemap regeneration stats - uses duration_ms column
  const { data: sitemapStats } = useQuery({
    queryKey: ['cronjob-sitemap-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_regeneration_log')
        .select('status, created_at, duration_ms')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const successCount = data.filter(d => d.status === 'success').length;
      const avgTime = data.filter(d => d.duration_ms).reduce((acc, d) => acc + (d.duration_ms || 0), 0) / Math.max(1, data.filter(d => d.duration_ms).length);
      
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

  // Fetch news generation logs - uses 'source' column, not 'generation_type'
  const { data: newsStats } = useQuery({
    queryKey: ['cronjob-news-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Group by source (the actual column name in the database)
      const bySource: Record<string, { total: number; success: number; failed: number; lastRun: string | null; lastStatus: string | null; avgExecutionTime: number | null }> = {};
      data.forEach(item => {
        const source = item.source || 'unknown';
        if (!bySource[source]) {
          bySource[source] = { total: 0, success: 0, failed: 0, lastRun: null, lastStatus: null, avgExecutionTime: null };
        }
        bySource[source].total++;
        if (item.status === 'success' || item.status === 'completed') {
          bySource[source].success++;
        }
        if (item.items_failed && item.items_failed > 0) {
          bySource[source].failed += item.items_failed;
        }
        if (!bySource[source].lastRun) {
          bySource[source].lastRun = item.created_at;
          bySource[source].lastStatus = item.status;
          bySource[source].avgExecutionTime = item.execution_time_ms;
        }
      });
      
      return { bySource, raw: data };
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

  // Fetch artist stories stats
  const { data: artistStoriesStats } = useQuery({
    queryKey: ['cronjob-artist-stories-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('id, created_at, is_published')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = data.filter(d => new Date(d.created_at) >= today).length;
      
      return {
        total: data.length,
        published: data.filter(d => d.is_published).length,
        todayCount,
        lastRun: data[0]?.created_at || null,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch music anecdotes stats
  const { data: anecdoteStats } = useQuery({
    queryKey: ['cronjob-anecdote-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_anecdotes')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return {
        total: data.length,
        lastRun: data[0]?.created_at || null,
      };
    },
    refetchInterval: 60000,
  });

  // Fetch curated artists stats (for generate-curated-artists)
  const { data: curatedArtistsStats } = useQuery({
    queryKey: ['cronjob-curated-artists-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curated_artists')
        .select('last_crawled_at, updated_at, is_active')
        .order('last_crawled_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      return {
        total: data.length,
        active: data.filter(d => d.is_active).length,
        lastCrawled: data[0]?.last_crawled_at || null,
        lastUpdated: data.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0]?.updated_at || null,
      };
    },
    refetchInterval: 60000,
  });

  // Fetch cronjob execution log (for functions that use direct logging)
  const { data: executionLogStats } = useQuery({
    queryKey: ['cronjob-execution-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronjob_execution_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      
      // Group by function_name
      const byFunction: Record<string, { total: number; success: number; failed: number; lastRun: string | null; lastStatus: string | null; avgExecutionTime: number | null; itemsProcessed: number }> = {};
      data.forEach(item => {
        const fn = item.function_name;
        if (!byFunction[fn]) {
          byFunction[fn] = { total: 0, success: 0, failed: 0, lastRun: null, lastStatus: null, avgExecutionTime: null, itemsProcessed: 0 };
        }
        byFunction[fn].total++;
        if (item.status === 'success') {
          byFunction[fn].success++;
        } else if (item.status === 'error') {
          byFunction[fn].failed++;
        }
        if (!byFunction[fn].lastRun) {
          byFunction[fn].lastRun = item.started_at;
          byFunction[fn].lastStatus = item.status;
          byFunction[fn].avgExecutionTime = item.execution_time_ms;
          byFunction[fn].itemsProcessed = item.items_processed || 0;
        }
      });
      
      return { byFunction, raw: data };
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
      queryClient.invalidateQueries({ queryKey: ['cronjob-batch-status'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-discogs-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-sitemap-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-news-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-indexnow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-artist-stories-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-anecdote-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-curated-artists-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cronjob-execution-log-stats'] });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cronjob_execution_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cronjob-execution-log-stats'] });
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
          running_count: blogBatch.status === 'running' || blogBatch.status === 'processing' ? 1 : 0,
          avg_execution_time_ms: null,
          last_run_at: blogBatch.updated_at,
          last_status: blogBatch.status === 'completed' ? 'success' : (blogBatch.status === 'running' || blogBatch.status === 'processing' ? 'running' : blogBatch.status),
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
          running_count: posterBatch.status === 'running' || posterBatch.status === 'processing' ? 1 : 0,
          avg_execution_time_ms: null,
          last_run_at: posterBatch.updated_at,
          last_status: posterBatch.status === 'completed' ? 'success' : (posterBatch.status === 'running' || posterBatch.status === 'processing' ? 'running' : posterBatch.status),
        };
      }
    }

    // Artist stories batch processor - maps to artist_story_generation or artist_stories
    if ((job.name === 'artist-stories-batch-processor' || job.name === 'daily-artist-stories-generator') && (batchStatus || artistStoriesStats)) {
      const artistBatch = batchStatus?.find(b => b.process_type === 'artist_story_generation' || b.process_type === 'artist_stories');
      
      // Use artistStoriesStats for more accurate last_run_at (actual stories created)
      const lastRunAt = artistStoriesStats?.lastRun || artistBatch?.updated_at || null;
      
      stats = {
        function_name: job.name,
        total_runs: artistStoriesStats?.total || artistBatch?.processed_items || 0,
        successful_runs: artistStoriesStats?.published || artistBatch?.successful_items || 0,
        failed_runs: artistBatch?.failed_items || 0,
        running_count: artistBatch?.status === 'running' || artistBatch?.status === 'processing' ? 1 : 0,
        avg_execution_time_ms: null,
        last_run_at: lastRunAt,
        last_status: lastRunAt ? 'success' : (artistBatch?.status === 'completed' ? 'success' : (artistBatch?.status === 'running' || artistBatch?.status === 'processing' ? 'running' : artistBatch?.status || null)),
      };
    }

    // News generation related cronjobs - map to actual 'source' values in DB
    if (newsStats?.bySource) {
      // Map cronjob names to the actual 'source' values stored in news_generation_logs
      const sourceMap: Record<string, string> = {
        'generate-daily-music-history': 'daily-news-update',
        'rss-news-rewriter': 'rss-feeds',
        'latest-discogs-news': 'music-news-enhanced',
      };
      
      const sourceKey = sourceMap[job.name];
      if (sourceKey && newsStats.bySource[sourceKey]) {
        const sourceStats = newsStats.bySource[sourceKey];
        stats = {
          function_name: job.name,
          total_runs: sourceStats.total,
          successful_runs: sourceStats.success,
          failed_runs: sourceStats.failed,
          running_count: 0,
          avg_execution_time_ms: sourceStats.avgExecutionTime,
          last_run_at: sourceStats.lastRun,
          last_status: sourceStats.lastStatus === 'success' || sourceStats.lastStatus === 'completed' || sourceStats.lastStatus === 'no_items' ? 'success' : sourceStats.lastStatus,
        };
      }
    }

    // Daily anecdote generator - track from music_anecdotes table
    if (job.name === 'daily-anecdote-generator' && anecdoteStats) {
      stats = {
        function_name: job.name,
        total_runs: anecdoteStats.total,
        successful_runs: anecdoteStats.total,
        failed_runs: 0,
        running_count: 0,
        avg_execution_time_ms: null,
        last_run_at: anecdoteStats.lastRun,
        last_status: anecdoteStats.lastRun ? 'success' : null,
      };
    }

    // Generate curated artists
    if (job.name === 'generate-curated-artists' && curatedArtistsStats) {
      stats = {
        function_name: job.name,
        total_runs: curatedArtistsStats.total,
        successful_runs: curatedArtistsStats.active,
        failed_runs: 0,
        running_count: 0,
        avg_execution_time_ms: null,
        last_run_at: curatedArtistsStats.lastUpdated,
        last_status: curatedArtistsStats.lastUpdated ? 'success' : null,
      };
    }

    // Update discogs-lp-crawler with last_crawled_at from curated_artists
    if (job.name === 'discogs-lp-crawler' && curatedArtistsStats?.lastCrawled) {
      stats = {
        function_name: job.name,
        total_runs: discogsStats?.total || 0,
        successful_runs: discogsStats?.completed || 0,
        failed_runs: discogsStats?.failed || 0,
        running_count: discogsStats?.pending || 0,
        avg_execution_time_ms: null,
        last_run_at: curatedArtistsStats.lastCrawled,
        last_status: 'success',
      };
    }

    // Functions that use direct cronjob_execution_log logging
    const directLoggedFunctions = [
      'generate-llm-sitemap',
      'auto-generate-keywords',
      'refresh-featured-photos',
    ];
    
    if (directLoggedFunctions.includes(job.name) && executionLogStats?.byFunction) {
      const fnStats = executionLogStats.byFunction[job.name];
      if (fnStats) {
        stats = {
          function_name: job.name,
          total_runs: fnStats.total,
          successful_runs: fnStats.success,
          failed_runs: fnStats.failed,
          running_count: 0,
          avg_execution_time_ms: fnStats.avgExecutionTime,
          last_run_at: fnStats.lastRun,
          last_status: fnStats.lastStatus,
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
      artistStoriesStats,
      anecdoteStats,
      curatedArtistsStats,
      executionLogStats,
    }
  };
};
