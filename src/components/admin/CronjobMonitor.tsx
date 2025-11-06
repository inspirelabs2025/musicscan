import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  TrendingUp,
  XCircle,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface CronjobStatus {
  name: string;
  lastRun?: Date;
  status: 'active' | 'idle' | 'error';
  processedToday: number;
  successRate: number;
  errorCount: number;
  schedule?: string;
}

interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  skipped: number;
  totalToday: number;
}

interface BatchStatus {
  id: string;
  status: string;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  queue_size: number;
  started_at: string;
  updated_at: string;
  last_heartbeat: string | null;
}

interface QueueItem {
  id: string;
  status: string;
  album_title: string;
  album_artist: string;
  attempt_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const CronjobMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [recentItems, setRecentItems] = useState<QueueItem[]>([]);
  const [itemsUpdate, setItemsUpdate] = useState<Date>(new Date());

  // Handlers to control blog generator
  const startBlogBatch = async () => {
    try {
      await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'start', batchSize: 1, delaySeconds: 30, mediaTypes: ['product','cd','vinyl','ai'], minConfidence: 0.7, dryRun: false }
      });
      setLastUpdate(new Date());
    } catch (e) { console.error('Failed to start blog batch', e); }
  };

  const runProcessorNow = async () => {
    try {
      await supabase.functions.invoke('batch-blog-processor', { body: { manual: true } });
      setLastUpdate(new Date());
    } catch (e) { console.error('Failed to run processor tick', e); }
  };

  // Real-time subscription voor queue status en items
  useEffect(() => {
    const channel = supabase
      .channel('cronjob-monitor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discogs_import_log'
        },
        () => {
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_processing_status'
        },
        () => {
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_queue_items'
        },
        () => {
          setItemsUpdate(new Date());
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sitemap_regeneration_log'
        },
        () => {
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sitemap_regeneration_queue'
        },
        () => {
          setLastUpdate(new Date());
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sitemap regeneration logs
  const { data: sitemapLogs } = useQuery({
    queryKey: ['sitemap-regeneration-logs', lastUpdate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_regeneration_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Sitemap queue status
  const { data: sitemapQueue } = useQuery({
    queryKey: ['sitemap-queue-status', lastUpdate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_regeneration_queue')
        .select('status, queued_at')
        .eq('status', 'pending')
        .order('queued_at', { ascending: true });
      
      if (error) throw error;
      return {
        pending: data.length,
        oldest_queued: data.length > 0 ? data[0].queued_at : null
      };
    },
    refetchInterval: 3000,
  });

  // Manual trigger for sitemap regeneration
  const triggerSitemapRegeneration = async () => {
    try {
      await supabase.functions.invoke('sitemap-queue-processor');
      toast.success('Sitemap regeneratie gestart');
    } catch (err: any) {
      toast.error('Fout bij sitemap regeneratie', {
        description: err.message
      });
    }
  };

  // Queue metrics
  const { data: queueMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['cronjob-queue-metrics', lastUpdate],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('discogs_import_log')
        .select('status, created_at');

      if (error) throw error;

      const metrics: QueueMetrics = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        totalToday: 0,
      };

      data.forEach((item) => {
        const createdAt = new Date(item.created_at);
        if (createdAt >= today) {
          metrics.totalToday++;
        }
        if (item.status in metrics) {
          metrics[item.status as keyof Omit<QueueMetrics, 'totalToday'>]++;
        }
      });

      return metrics;
    },
    refetchInterval: 5000,
  });

  // Batch processing status
  const { data: batchStatus } = useQuery({
    queryKey: ['batch-processing-status', lastUpdate],
    queryFn: async () => {
      const { data: activeBatch } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'blog_generation')
        .in('status', ['running', 'active'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBatch) return activeBatch as BatchStatus;

      const { data: latestBatch, error } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'blog_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return latestBatch as BatchStatus | null;
    },
    refetchInterval: 3000, // Faster polling
  });

  // Recent queue items for live activity feed
  const { data: queueItems } = useQuery({
    queryKey: ['batch-queue-items', itemsUpdate, batchStatus?.id],
    queryFn: async () => {
      if (!batchStatus?.id) return [];

      const { data, error } = await supabase
        .from('batch_queue_items')
        .select('id, status, album_title, album_artist, attempt_count, error_message, created_at, updated_at')
        .eq('batch_id', batchStatus.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as QueueItem[];
    },
    enabled: !!batchStatus?.id,
    refetchInterval: 3000,
  });

  // Update recent items when data changes
  useEffect(() => {
    if (queueItems) {
      setRecentItems(queueItems);
    }
  }, [queueItems]);

  // Calculate cronjob statuses
  const cronjobStatuses: CronjobStatus[] = [
    {
      name: 'Discogs LP Crawler',
      status: queueMetrics && queueMetrics.pending > 0 ? 'active' : 'idle',
      processedToday: queueMetrics?.totalToday || 0,
      successRate: queueMetrics 
        ? Math.round((queueMetrics.completed / Math.max(1, queueMetrics.totalToday)) * 100)
        : 0,
      errorCount: queueMetrics?.failed || 0,
      schedule: 'Elk uur',
    },
    {
      name: 'Queue Processor',
      status: queueMetrics && (queueMetrics.processing > 0 || queueMetrics.pending > 0) ? 'active' : 'idle',
      processedToday: queueMetrics?.completed || 0,
      successRate: queueMetrics 
        ? Math.round((queueMetrics.completed / Math.max(1, queueMetrics.completed + queueMetrics.failed)) * 100)
        : 0,
      errorCount: queueMetrics?.failed || 0,
      schedule: 'Elke 2 minuten',
    },
    {
      name: 'Blog Generator',
      status: batchStatus && (batchStatus.status === 'running' || batchStatus.status === 'active') ? 'active' : 'idle',
      processedToday: batchStatus?.processed_items || 0,
      successRate: batchStatus
        ? Math.round((batchStatus.successful_items / Math.max(1, batchStatus.processed_items)) * 100)
        : 0,
      errorCount: batchStatus?.failed_items || 0,
      schedule: 'Elke 10 minuten',
    },
    {
      name: 'IndexNow Processor',
      status: 'active',
      processedToday: 0,
      successRate: 100,
      errorCount: 0,
      schedule: 'Elke 5 minuten',
    },
    {
      name: 'Sitemap Regeneratie',
      status: sitemapQueue && sitemapQueue.pending > 0 ? 'active' : 'idle',
      processedToday: sitemapLogs?.filter(l => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(l.created_at) >= today;
      }).length || 0,
      successRate: sitemapLogs 
        ? Math.round((sitemapLogs.filter(l => l.status === 'success').length / Math.max(1, sitemapLogs.length)) * 100)
        : 100,
      errorCount: sitemapLogs?.filter(l => l.status === 'failed').length || 0,
      schedule: 'Elke 3 minuten',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'idle':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (metricsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const overallHealth = cronjobStatuses.every(job => job.errorCount === 0) ? 'healthy' : 
                        cronjobStatuses.some(job => job.errorCount > 5) ? 'critical' : 'warning';

  return (
    <div className="space-y-6">
      {/* Header met connection status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cronjob Monitor
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
              </div>
              <Badge variant={overallHealth === 'healthy' ? 'default' : 'destructive'}>
                {overallHealth === 'healthy' ? 'Gezond' : overallHealth === 'warning' ? 'Waarschuwing' : 'Kritiek'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cronjob Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cronjobStatuses.map((job) => (
          <Card key={job.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{job.name}</CardTitle>
                {getStatusIcon(job.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={job.status === 'active' ? 'default' : 'outline'}>
                  {job.status}
                </Badge>
              </div>
              
              {job.schedule && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Schema</span>
                  <Badge variant="secondary">{job.schedule}</Badge>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Verwerkt vandaag</span>
                  <span className="text-2xl font-bold">{job.processedToday}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Succes Rate</span>
                  <div className="flex items-center gap-2">
                    {job.successRate >= 90 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : job.successRate >= 70 ? (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-semibold">{job.successRate}%</span>
                  </div>
                </div>
                <Progress value={job.successRate} className="h-2" />
              </div>

              {job.errorCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Errors</span>
                  <Badge variant="destructive">{job.errorCount}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Queue Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="text-3xl font-bold">{queueMetrics?.pending || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Processing</span>
              </div>
              <div className="text-3xl font-bold">{queueMetrics?.processing || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-3xl font-bold">{queueMetrics?.completed || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Skipped</span>
              </div>
              <div className="text-3xl font-bold">{queueMetrics?.skipped || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Failed</span>
              </div>
              <div className="text-3xl font-bold">{queueMetrics?.failed || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Processing Status */}
      {batchStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Blog Generation Batch
                {(batchStatus.status === 'running' || batchStatus.status === 'active') && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-normal text-muted-foreground">Processing</span>
                  </div>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {(batchStatus.status !== 'running' && batchStatus.status !== 'active') && (
                  <Button size="sm" onClick={startBlogBatch}>Start Batch</Button>
                )}
                <Button variant="outline" size="sm" onClick={runProcessorNow}>
                  <Zap className="h-4 w-4 mr-1" />
                  Process Now
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge variant={batchStatus.status === 'running' || batchStatus.status === 'active' ? 'default' : 'outline'}>
                  {batchStatus.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Verwerkt</div>
                <div className="text-2xl font-bold">{batchStatus.processed_items}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Succesvol</div>
                <div className="text-2xl font-bold text-green-500">{batchStatus.successful_items}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Mislukt</div>
                <div className="text-2xl font-bold text-red-500">{batchStatus.failed_items}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Heartbeat</div>
                <div className="text-xs font-mono">
                  {batchStatus.last_heartbeat 
                    ? new Date(batchStatus.last_heartbeat).toLocaleTimeString('nl-NL')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Voortgang</span>
                <span className="text-sm font-medium">
                  {batchStatus.processed_items} / {batchStatus.queue_size} 
                  ({Math.round((batchStatus.processed_items / Math.max(1, batchStatus.queue_size)) * 100)}%)
                </span>
              </div>
              <Progress 
                value={(batchStatus.processed_items / Math.max(1, batchStatus.queue_size)) * 100} 
                className="h-3"
              />
            </div>

            {/* Live Activity Feed */}
            {recentItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4" />
                  Recente Activiteit
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border">
                      <div className="mt-1">
                        {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                        {item.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                        {item.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                        {item.status === 'skipped' && <AlertCircle className="h-4 w-4 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.album_artist} - {item.album_title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                          {item.attempt_count > 1 && (
                            <span className="text-xs text-muted-foreground">
                              Poging {item.attempt_count}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.updated_at).toLocaleTimeString('nl-NL')}
                          </span>
                        </div>
                        {item.error_message && (
                          <div className="text-xs text-red-500 mt-1 truncate">
                            {item.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Batch ID: {batchStatus.id.substring(0, 8)}...</span>
              <span>Laatste update: {new Date(batchStatus.updated_at).toLocaleString('nl-NL')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sitemap Regeneratie Monitor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sitemap Regeneratie
              {sitemapQueue && sitemapQueue.pending > 0 && (
                <Badge variant="default">{sitemapQueue.pending} in queue</Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={triggerSitemapRegeneration}>
              Force Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Queue status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Pending in Queue</div>
                <div className="text-2xl font-bold">{sitemapQueue?.pending || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Laatste Regeneratie</div>
                <div className="text-sm font-mono">
                  {sitemapLogs?.[0]?.completed_at 
                    ? formatDistanceToNow(new Date(sitemapLogs[0].completed_at), { addSuffix: true, locale: nl })
                    : 'Nog niet uitgevoerd'}
                </div>
              </div>
            </div>
            
            {/* Recent logs */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Recente Regeneraties</div>
              {sitemapLogs?.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>{log.trigger_source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.gsc_submitted && <Badge variant="outline">GSC ✓</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {log.duration_ms}ms
                    </span>
                  </div>
                </div>
              ))}
              {(!sitemapLogs || sitemapLogs.length === 0) && (
                <div className="text-sm text-muted-foreground">Geen regeneraties gevonden</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        Laatste update: {lastUpdate.toLocaleTimeString('nl-NL')} • Real-time updates actief
      </div>
    </div>
  );
};
