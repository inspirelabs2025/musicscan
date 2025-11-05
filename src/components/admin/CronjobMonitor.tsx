import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  XCircle,
  Zap
} from "lucide-react";

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
  status: string;
  items_processed: number;
  items_successful: number;
  items_failed: number;
  queue_size: number;
  started_at: string;
  updated_at: string;
}

export const CronjobMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time subscription voor queue status
  useEffect(() => {
    const channel = supabase
      .channel('cronjob-monitor')
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
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      const { data, error } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'blog_generation')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BatchStatus | null;
    },
    refetchInterval: 5000,
  });

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
      status: queueMetrics && queueMetrics.processing > 0 ? 'active' : 'idle',
      processedToday: queueMetrics?.completed || 0,
      successRate: queueMetrics 
        ? Math.round((queueMetrics.completed / Math.max(1, queueMetrics.completed + queueMetrics.failed)) * 100)
        : 0,
      errorCount: queueMetrics?.failed || 0,
      schedule: 'Elke 2 minuten',
    },
    {
      name: 'Blog Generator',
      status: batchStatus?.status === 'running' ? 'active' : 'idle',
      processedToday: batchStatus?.items_processed || 0,
      successRate: batchStatus
        ? Math.round((batchStatus.items_successful / Math.max(1, batchStatus.items_processed)) * 100)
        : 0,
      errorCount: batchStatus?.items_failed || 0,
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
            <CardTitle>Blog Generation Batch Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={batchStatus.status === 'running' ? 'default' : 'outline'}>
                  {batchStatus.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Verwerkt</div>
                <div className="text-2xl font-bold">{batchStatus.items_processed}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Succesvol</div>
                <div className="text-2xl font-bold text-green-500">{batchStatus.items_successful}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Mislukt</div>
                <div className="text-2xl font-bold text-red-500">{batchStatus.items_failed}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Voortgang</span>
                <span className="text-sm font-medium">
                  {batchStatus.items_processed} / {batchStatus.queue_size}
                </span>
              </div>
              <Progress 
                value={(batchStatus.items_processed / Math.max(1, batchStatus.queue_size)) * 100} 
                className="h-2"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Laatste update: {new Date(batchStatus.updated_at).toLocaleString('nl-NL')}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Laatste update: {lastUpdate.toLocaleTimeString('nl-NL')} • Updates elke 5 seconden
      </div>
    </div>
  );
};
