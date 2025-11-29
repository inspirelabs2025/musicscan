import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Content sources - the PRIMARY source of truth for status
export interface ContentSource {
  id: string;
  label: string;
  table: string;
  dateColumn: string;
  publishedColumn?: string; // Column that tracks published status (e.g., 'is_published')
  filter?: string;
  schedule: string;
  expectedDaily: number;
  warningAfterHours: number;
  icon: string;
}

export const CONTENT_SOURCES: ContentSource[] = [
  { 
    id: 'anecdotes', 
    label: 'Anekdotes', 
    table: 'music_anecdotes', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 06:05',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '🎭'
  },
  { 
    id: 'music_history', 
    label: 'Muziekgeschiedenis', 
    table: 'music_history_events', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 06:00',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '📜'
  },
  { 
    id: 'news', 
    label: 'Nieuws Artikelen', 
    table: 'news_blog_posts', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: '3x per dag',
    expectedDaily: 3,
    warningAfterHours: 10,
    icon: '📰'
  },
  { 
    id: 'youtube', 
    label: 'YouTube Videos', 
    table: 'youtube_discoveries', 
    dateColumn: 'created_at',
    schedule: 'Continu',
    expectedDaily: 20,
    warningAfterHours: 8,
    icon: '🎬'
  },
  { 
    id: 'spotify', 
    label: 'Spotify Releases', 
    table: 'spotify_new_releases_processed', 
    dateColumn: 'created_at',
    schedule: 'Dagelijks 09:00',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '🎵'
  },
  { 
    id: 'artist_stories', 
    label: 'Artist Stories', 
    table: 'artist_stories', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 01:00',
    expectedDaily: 1,
    warningAfterHours: 48,
    icon: '👤'
  },
  { 
    id: 'music_stories', 
    label: 'Music Stories', 
    table: 'music_stories', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Continu',
    expectedDaily: 10,
    warningAfterHours: 8,
    icon: '📖'
  },
  { 
    id: 'blogs', 
    label: 'Blog Posts', 
    table: 'blog_posts', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Continu',
    expectedDaily: 50,
    warningAfterHours: 4,
    icon: '📝'
  },
  { 
    id: 'indexnow', 
    label: 'IndexNow', 
    table: 'indexnow_submissions', 
    dateColumn: 'submitted_at',
    schedule: 'Elke 15 min',
    expectedDaily: 10,
    warningAfterHours: 6,
    icon: '🔍'
  },
];

export interface ContentActivity {
  source: ContentSource;
  lastActivity: Date | null;
  countInPeriod: number;
  total: number;
  publishedCount: number | null;
  unpublishedCount: number | null;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  hoursSinceActivity: number | null;
}

export interface QueueStats {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

function calculateStatus(
  source: ContentSource,
  lastActivity: Date | null,
  countInPeriod: number
): 'ok' | 'warning' | 'error' | 'unknown' {
  if (!lastActivity) return 'unknown';
  
  const hoursSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  // Error if way over threshold
  if (hoursSince > source.warningAfterHours) {
    return 'error';
  }
  
  // Warning if approaching threshold
  if (hoursSince > source.warningAfterHours * 0.75) {
    return 'warning';
  }
  
  // OK if recent activity
  return 'ok';
}

export function useStatusDashboard(periodHours: number = 24) {
  // Fetch content activity for each source
  const { data: contentActivity, isLoading: contentLoading, refetch: refetchContent } = useQuery({
    queryKey: ['content-activity', periodHours],
    queryFn: async () => {
      const activities: ContentActivity[] = [];
      const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();
      
      for (const source of CONTENT_SOURCES) {
        try {
          // Get last activity and count in period
          const { data: lastRecord } = await supabase
            .from(source.table as any)
            .select(source.dateColumn)
            .order(source.dateColumn, { ascending: false })
            .limit(1)
            .single();
          
          const { count: periodCount } = await supabase
            .from(source.table as any)
            .select('*', { count: 'exact', head: true })
            .gte(source.dateColumn, periodStart);
          
          const { count: totalCount } = await supabase
            .from(source.table as any)
            .select('*', { count: 'exact', head: true });
          
          // Fetch published/unpublished counts if the table has a publishedColumn
          let publishedCount: number | null = null;
          let unpublishedCount: number | null = null;
          
          if (source.publishedColumn) {
            const { count: pubCount } = await supabase
              .from(source.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(source.publishedColumn, true);
            
            const { count: unpubCount } = await supabase
              .from(source.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(source.publishedColumn, false);
            
            publishedCount = pubCount || 0;
            unpublishedCount = unpubCount || 0;
          }
          
          const lastActivity = lastRecord?.[source.dateColumn] 
            ? new Date(lastRecord[source.dateColumn]) 
            : null;
          
          const hoursSinceActivity = lastActivity 
            ? (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60)
            : null;
          
          activities.push({
            source,
            lastActivity,
            countInPeriod: periodCount || 0,
            total: totalCount || 0,
            publishedCount,
            unpublishedCount,
            status: calculateStatus(source, lastActivity, periodCount || 0),
            hoursSinceActivity
          });
        } catch (error) {
          console.error(`Error fetching ${source.table}:`, error);
          activities.push({
            source,
            lastActivity: null,
            countInPeriod: 0,
            total: 0,
            publishedCount: null,
            unpublishedCount: null,
            status: 'unknown',
            hoursSinceActivity: null
          });
        }
      }
      
      return activities;
    },
    refetchInterval: 60000,
  });

  // Fetch queue statistics
  const { data: queueStats, isLoading: queuesLoading } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const queues: QueueStats[] = [];
      
      // Singles queue
      const { data: singlesData } = await supabase
        .from('singles_import_queue')
        .select('status');
      
      if (singlesData) {
        queues.push({
          name: 'Singles Import',
          pending: singlesData.filter(s => s.status === 'pending').length,
          processing: singlesData.filter(s => s.status === 'processing').length,
          completed: singlesData.filter(s => s.status === 'completed').length,
          failed: singlesData.filter(s => s.status === 'failed').length,
        });
      }
      
      // Discogs queue
      const { data: discogsData } = await supabase
        .from('discogs_import_log')
        .select('status');
      
      if (discogsData) {
        queues.push({
          name: 'Discogs Import',
          pending: discogsData.filter(s => s.status === 'pending').length,
          processing: discogsData.filter(s => s.status === 'processing').length,
          completed: discogsData.filter(s => s.status === 'completed').length,
          failed: discogsData.filter(s => s.status === 'failed').length,
        });
      }
      
      // Batch queue
      const { data: batchData } = await supabase
        .from('batch_queue_items')
        .select('status');
      
      if (batchData) {
        queues.push({
          name: 'Batch Queue',
          pending: batchData.filter(s => s.status === 'pending').length,
          processing: batchData.filter(s => s.status === 'processing').length,
          completed: batchData.filter(s => s.status === 'completed').length,
          failed: batchData.filter(s => s.status === 'failed').length,
        });
      }
      
      return queues;
    },
    refetchInterval: 60000,
  });

  // Fetch recent cron logs (for reference only)
  const { data: cronLogs, isLoading: cronLoading } = useQuery({
    queryKey: ['cron-logs-recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cronjob_execution_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Calculate issues
  const issues = contentActivity?.filter(a => a.status === 'error' || a.status === 'warning') || [];
  const hasIssues = issues.length > 0;
  const errorCount = contentActivity?.filter(a => a.status === 'error').length || 0;
  const warningCount = contentActivity?.filter(a => a.status === 'warning').length || 0;

  return {
    contentActivity: contentActivity || [],
    queueStats: queueStats || [],
    cronLogs: cronLogs || [],
    issues,
    hasIssues,
    errorCount,
    warningCount,
    isLoading: contentLoading || queuesLoading || cronLoading,
    refetch: refetchContent,
  };
}
