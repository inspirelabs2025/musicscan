import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

interface BatchStatus {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at: string | null;
  last_heartbeat: string | null;
  queue_size: number;
  process_type: string;
}

interface QueueItem {
  id: string;
  status: string;
  item_type: string;
  created_at: string;
  processed_at: string | null;
  attempts: number;
  error_message: string | null;
}

interface ProcessingMetric {
  timestamp: string;
  itemsPerMinute: number;
  successRate: number;
  queueSize: number;
}

export const BatchProgressDashboard: React.FC = () => {
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [metrics, setMetrics] = useState<ProcessingMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Calculate processing rate and ETA
  const calculateMetrics = (status: BatchStatus | null) => {
    if (!status || !status.started_at) return { processingRate: 0, eta: null, successRate: 0 };

    const startTime = new Date(status.started_at).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    const processingRate = elapsedMinutes > 0 ? status.processed_items / elapsedMinutes : 0;
    const remainingItems = Math.max(0, status.total_items - status.processed_items);
    const etaMinutes = processingRate > 0 ? remainingItems / processingRate : null;
    const successRate = status.processed_items > 0 ? (status.successful_items / status.processed_items) * 100 : 0;

    return {
      processingRate: Math.round(processingRate * 10) / 10,
      eta: etaMinutes ? new Date(Date.now() + etaMinutes * 60 * 1000) : null,
      successRate: Math.round(successRate * 10) / 10
    };
  };

  const { processingRate, eta, successRate } = calculateMetrics(batchStatus);

  // Real-time subscriptions
  useEffect(() => {
    let statusChannel: any;
    let queueChannel: any;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to batch status changes
        statusChannel = supabase
          .channel('batch-status-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'batch_processing_status'
            },
            (payload) => {
              console.log('Batch status change:', payload);
              if (payload.new) {
                setBatchStatus(payload.new as any);
                setLastUpdate(new Date());
              }
            }
          )
          .subscribe();

        // Subscribe to queue item changes
        queueChannel = supabase
          .channel('queue-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'batch_queue_items'
            },
            (payload) => {
              console.log('Queue change:', payload);
              fetchQueueItems();
              setLastUpdate(new Date());
            }
          )
          .subscribe();

        setIsConnected(true);

        // Initial data fetch
        await fetchBatchStatus();
        await fetchQueueItems();

      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setIsConnected(false);
      }
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      if (statusChannel) supabase.removeChannel(statusChannel);
      if (queueChannel) supabase.removeChannel(queueChannel);
    };
  }, []);

  // Fetch current batch status
  const fetchBatchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_processing_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching batch status:', error);
        return;
      }

      if (data) {
        setBatchStatus(data);
      }
    } catch (error) {
      console.error('Error fetching batch status:', error);
    }
  };

  // Fetch queue items
  const fetchQueueItems = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_queue_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching queue items:', error);
        return;
      }

      setQueueItems(data as any || []);
    } catch (error) {
      console.error('Error fetching queue items:', error);
    }
  };

  // Update metrics periodically
  useEffect(() => {
    if (!batchStatus) return;

    const updateMetrics = () => {
      const newMetric: ProcessingMetric = {
        timestamp: new Date().toLocaleTimeString(),
        itemsPerMinute: processingRate,
        successRate,
        queueSize: batchStatus.queue_size
      };

      setMetrics(prev => [...prev.slice(-19), newMetric]); // Keep last 20 points
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [batchStatus, processingRate, successRate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600';
      case 'running': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />;
      case 'running': return <Zap className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!batchStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Voortgangs Dashboard</CardTitle>
          <CardDescription>Geen actieve batch gevonden</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const progressPercentage = batchStatus.total_items > 0 
    ? (batchStatus.processed_items / batchStatus.total_items) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={isConnected ? "border-green-500" : "border-red-500"}>
        <Activity className={`h-4 w-4 ${isConnected ? "text-green-600" : "text-red-600"}`} />
        <AlertDescription>
          {isConnected ? "Live verbinding actief" : "Verbinding verloren"} 
          {lastUpdate && ` • Laatste update: ${lastUpdate.toLocaleTimeString()}`}
        </AlertDescription>
      </Alert>

      {/* Main Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className={getStatusColor(batchStatus.status)}>
                  {getStatusIcon(batchStatus.status)}
                </span>
                Live Voortgangs Dashboard
              </CardTitle>
              <CardDescription>
                Batch Status: <Badge variant="outline" className={getStatusColor(batchStatus.status)}>
                  {batchStatus.status.toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {batchStatus.processed_items} / {batchStatus.total_items} items
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="h-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{batchStatus.successful_items}</div>
              <div className="text-muted-foreground">Succesvol</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-red-600">{batchStatus.failed_items}</div>
              <div className="text-muted-foreground">Gefaald</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-blue-600">{batchStatus.queue_size}</div>
              <div className="text-muted-foreground">In Wachtrij</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{processingRate}/min</div>
              <div className="text-muted-foreground">Snelheid</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {batchStatus.successful_items} van {batchStatus.processed_items} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingRate}</div>
            <p className="text-xs text-muted-foreground">items per minuut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ETA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eta ? eta.toLocaleTimeString() : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {eta ? 'Geschatte voltooiing' : 'Berekening...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Processing rate over tijd</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="itemsPerMinute" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Items/min"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Success %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {queueItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente Activiteit</CardTitle>
            <CardDescription>Laatste {queueItems.length} queue items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'failed' ? 'destructive' :
                      item.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {item.status}
                    </Badge>
                    <span className="text-sm">{item.item_type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.processed_at 
                      ? new Date(item.processed_at).toLocaleTimeString()
                      : new Date(item.created_at).toLocaleTimeString()
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};