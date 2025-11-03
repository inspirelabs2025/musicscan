import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Play, Square, RotateCcw, Clock, CheckCircle, XCircle, Pause, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BatchProgressDashboard } from './BatchProgressDashboard';

interface BatchStatus {
  id?: string;
  status: 'idle' | 'active' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  total_items?: number;
  processed_items?: number;
  successful_items?: number;
  failed_items?: number;
  started_at?: string;
  completed_at?: string;
  current_item?: string;
  failed_item_details?: Array<{
    id: string;
    error: string;
    type: string;
  }>;
  queue_size?: number;
  last_heartbeat?: string;
  auto_mode?: boolean;
  queue_pending?: number;
  queue_processing?: number;
  queue_completed?: number;
  queue_failed?: number;
}

export function BatchBlogGenerator() {
  const [status, setStatus] = useState<BatchStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    batchSize: 1, // One album at a time for maximum stability
    delaySeconds: 30, // Shorter delay since processing one at a time
    mediaTypes: ['product', 'cd', 'vinyl', 'ai'],
    minConfidence: 0.7,
    dryRun: false
  });
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status.status === 'active' || status.status === 'running') {
      interval = setInterval(async () => {
        try {
          const { data: edgeFunctionData, error: edgeError } = await supabase.functions.invoke('batch-blog-generator', {
            body: { action: 'status' }
          });
          
          // Always check database status for comparison
          const databaseStatus = await checkDatabaseStatus();

          console.log('🔄 Polling Status Debug:', {
            edgeFunction: edgeFunctionData,
            database: databaseStatus,
            edgeError
          });

          let activeStatus: BatchStatus;

          // Use database status if Edge Function fails or shows inconsistent data
          if (edgeError || !edgeFunctionData || (databaseStatus && databaseStatus.status !== edgeFunctionData.status)) {
            console.log('⚠️ Using database status during polling');
            activeStatus = databaseStatus || { status: 'idle' };
          } else {
            activeStatus = edgeFunctionData;
          }

          setStatus(activeStatus);
          setLastUpdate(new Date());
          
          // Auto-cleanup stuck batches (if no heartbeat for 5+ minutes)
          if (activeStatus.last_heartbeat) {
            const lastHeartbeat = new Date(activeStatus.last_heartbeat);
            const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
            
            if (timeSinceHeartbeat > 5 * 60 * 1000) { // 5 minutes
              toast({
                title: "Batch mogelijk gestopt",
                description: "De automatische verwerking lijkt gestopt. Cron job mogelijk inactief.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error('Error checking batch status:', error);
          // Fallback to database status
          const databaseStatus = await checkDatabaseStatus();
          if (databaseStatus) {
            console.log('🔄 Using database status as polling fallback');
            setStatus(databaseStatus);
          }
        }
      }, 10000); // Check every 10 seconds for active batches
    } else {
      checkStatus();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.status]);

  const checkDatabaseStatus = async (): Promise<BatchStatus | null> => {
    try {
      const { data: dbStatus, error: dbError } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'blog_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (dbError) throw dbError;

      const { data: queueData, error: queueError } = await supabase
        .from('batch_queue_items')
        .select('status')
        .eq('batch_id', dbStatus.id);

      if (queueError) throw queueError;

      const queueStats = {
        queue_pending: queueData.filter(item => item.status === 'pending').length,
        queue_processing: queueData.filter(item => item.status === 'processing').length,
        queue_completed: queueData.filter(item => item.status === 'completed').length,
        queue_failed: queueData.filter(item => item.status === 'failed').length,
      };

      return {
        id: dbStatus.id,
        status: dbStatus.status as BatchStatus['status'],
        total_items: dbStatus.total_items,
        processed_items: dbStatus.processed_items,
        successful_items: dbStatus.successful_items,
        failed_items: dbStatus.failed_items,
        started_at: dbStatus.started_at,
        completed_at: dbStatus.completed_at,
        last_heartbeat: dbStatus.last_heartbeat,
        auto_mode: dbStatus.auto_mode,
        ...queueStats,
        queue_size: queueData.length
      };
    } catch (error) {
      console.error('Failed to check database status:', error);
      return null;
    }
  };

  const checkStatus = async () => {
    try {
      // First try Edge Function
      const { data: edgeFunctionData, error: edgeError } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'status' }
      });

      // Always check database status as well
      const databaseStatus = await checkDatabaseStatus();

      console.log('🔍 Status Check Debug:', {
        edgeFunction: edgeFunctionData,
        database: databaseStatus,
        edgeError
      });

      // Use database status if Edge Function fails or shows inconsistent data
      if (edgeError || !edgeFunctionData || (databaseStatus && databaseStatus.status !== edgeFunctionData.status)) {
        console.log('⚠️ Using database status as fallback');
        if (databaseStatus) {
          setStatus(databaseStatus);
          return;
        }
      }

      if (edgeError) throw edgeError;
      setStatus(edgeFunctionData || { status: 'idle' });
    } catch (error) {
      console.error('Failed to check batch status:', error);
      // Try database status as final fallback
      const databaseStatus = await checkDatabaseStatus();
      if (databaseStatus) {
        console.log('🔄 Using database status as final fallback');
        setStatus(databaseStatus);
      } else {
        setStatus({ status: 'idle' });
      }
    }
  };

  const startBatch = async () => {
    setIsLoading(true);
    setDryRunResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: {
          action: 'start',
          ...settings
        }
      });

      if (error) throw error;

      if (settings.dryRun) {
        setDryRunResult(data);
        toast({
          title: "Dry Run Voltooid",
          description: `${data.itemsFound} items gevonden.`
        });
      } else {
        toast({
          title: "Batch Generatie Gestart",
          description: `${data.totalItems} items worden automatisch verwerkt door cron job.`
        });
        // Check status immediately after starting
        setTimeout(checkStatus, 1000);
      }
    } catch (error) {
      console.error('Failed to start batch:', error);
      toast({
        title: "Fout bij Starten",
        description: "Kon batch generatie niet starten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopBatch = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'stop' }
      });
      
      if (error) throw error;
      
      setStatus(prev => ({ ...prev, status: 'paused' }));
      setLastUpdate(new Date());
      toast({
        title: "Batch gepauzeerd",
        description: "Batch is gepauzeerd. Cron job zal stoppen met verwerken."
      });
    } catch (error) {
      console.error('Error stopping batch:', error);
      toast({
        title: "Fout bij pauzeren batch",
        description: "Er is een fout opgetreden bij het pauzeren van de batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forceStopBatch = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'force_stop' }
      });
      
      if (error) throw error;
      
      // Refresh status
      await checkStatus();
      setLastUpdate(new Date());
      
      toast({
        title: "Batch geforceerd gestopt",
        description: "De batch is geforceerd gestopt en de wachtrij is geleegd."
      });
    } catch (error) {
      console.error('Error force stopping batch:', error);
      toast({
        title: "Fout bij geforceerd stoppen",
        description: "Er is een fout opgetreden bij het geforceerd stoppen van de batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resumeBatch = async () => {
    try {
      setIsLoading(true);
      
      // Change status back to active
      await supabase
        .from('batch_processing_status')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('process_type', 'blog_generation')
        .eq('status', 'paused');
      
      setStatus(prev => ({ ...prev, status: 'active' }));
      setLastUpdate(new Date());
      
      toast({
        title: "Batch hervat",
        description: "Batch is hervat. Cron job zal verwerking hervatten."
      });
    } catch (error) {
      console.error('Error resuming batch:', error);
      toast({
        title: "Fout bij hervatten batch",
        description: "Er is een fout opgetreden bij het hervatten van de batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixBatchStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check current queue status
      const { data: queueData } = await supabase
        .from('batch_queue_items')
        .select('status')
        .eq('batch_id', status.id);
      
      const pendingCount = queueData?.filter(item => item.status === 'pending').length || 0;
      
      if (pendingCount > 0) {
        // Reset batch to active since there are pending items
        const { error } = await supabase
          .from('batch_processing_status')
          .update({ 
            status: 'active',
            completed_at: null,
            last_heartbeat: new Date().toISOString(),
            processed_items: 0,
            successful_items: 0,
            failed_items: 0,
            queue_size: pendingCount,
            updated_at: new Date().toISOString()
          })
          .eq('process_type', 'blog_generation')
          .eq('id', status.id);

        if (error) throw error;
        toast({
          title: "Batch herstart",
          description: `Batch herstart met ${pendingCount} items in de wachtrij`
        });
      } else {
        // No pending items, set to idle
        const { error } = await supabase
          .from('batch_processing_status')
          .update({ 
            status: 'idle',
            stopped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('process_type', 'blog_generation')
          .eq('id', status.id);

        if (error) throw error;
        toast({
          title: "Batch status gerepareerd",
          description: "Batch status gerepareerd naar idle (geen items in wachtrij)"
        });
      }
      
      await checkStatus();
    } catch (error) {
      console.error('Error fixing batch status:', error);
      toast({
        title: "Fout bij repareren batch status",
        description: "Er is een fout opgetreden bij het repareren van de batch status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseBatch = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('batch_processing_status')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('process_type', 'blog_generation')
        .eq('status', 'active');
      
      if (error) throw error;

      setStatus(prev => ({ ...prev, status: 'paused' }));
      setLastUpdate(new Date());
      
      toast({
        title: "Batch gepauzeerd",
        description: "Batch is gepauzeerd. Cron job zal stoppen met verwerken."
      });
    } catch (error) {
      console.error('Error pausing batch:', error);
      toast({
        title: "Fout bij pauzeren batch",
        description: "Er is een fout opgetreden bij het pauzeren van de batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopAllBatches = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('batch_processing_status')
        .update({ 
          status: 'stopped',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('process_type', 'blog_generation')
        .in('status', ['active', 'running', 'paused']);
      
      if (error) throw error;

      await checkStatus();
      setLastUpdate(new Date());
      
      toast({
        title: "Alle batches gestopt",
        description: "Alle actieve batches zijn gestopt."
      });
    } catch (error) {
      console.error('Error stopping all batches:', error);
      toast({
        title: "Fout bij stoppen batches",
        description: "Er is een fout opgetreden bij het stoppen van de batches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedItems = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'retry_failed' }
      });
      
      if (error) throw error;
      
      toast({
        title: "Mislukte items herstarten",
        description: `${data.failedItemsCount} mislukte items worden opnieuw verwerkt.`
      });
      
      // Check status immediately after starting retry
      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error('Error retrying failed items:', error);
      toast({
        title: "Fout bij herstarten",
        description: "Er is een fout opgetreden bij het herstarten van mislukte items",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'running': return 'bg-orange-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'stopped': return 'bg-orange-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <RotateCcw className="h-4 w-4 animate-spin" />;
      case 'running': return <AlertTriangle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'stopped': return <XCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const progressPercentage = status.total_items 
    ? Math.round((status.processed_items || 0) / status.total_items * 100) 
    : 0;

  const isActive = status.status === 'active';
  const isPaused = status.status === 'paused';
  const canStart = ['idle', 'completed', 'stopped', 'failed'].includes(status.status);
  const canPause = isActive;
  const canResume = isPaused && (status.queue_pending || 0) > 0;
  const canRetryFailed = ['completed', 'stopped', 'failed', 'idle'].includes(status.status) && (status.queue_failed || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Live Dashboard - only show when batch is active/running */}
      {['active', 'running', 'paused'].includes(status.status) && (
        <BatchProgressDashboard />
      )}

      <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Automatische Batch Blog Generator
          <Badge variant="outline" className={getStatusColor(status.status)}>
            {getStatusIcon(status.status)}
            {status.status}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Werkt automatisch via cron job - geen sessie-afhankelijkheid
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Instellingen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minConfidence">Min. Betrouwbaarheid (AI scans)</Label>
              <Input
                id="minConfidence"
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={settings.minConfidence}
                onChange={(e) => setSettings(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) || 0.7 }))}
                disabled={isActive}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Media Types om te verwerken:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'product', label: 'Art Products (LP Metaalprints)', badge: '🎨' },
                { value: 'cd', label: 'CD Scans', badge: '💿' },
                { value: 'vinyl', label: 'Vinyl Scans', badge: '📀' },
                { value: 'ai', label: 'AI Scans', badge: '🤖' }
              ].map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Switch
                    id={`type-${type.value}`}
                    checked={settings.mediaTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({
                        ...prev,
                        mediaTypes: checked 
                          ? [...prev.mediaTypes, type.value]
                          : prev.mediaTypes.filter(t => t !== type.value)
                      }));
                    }}
                    disabled={isActive}
                  />
                  <Label htmlFor={`type-${type.value}`} className="text-sm">
                    {type.badge} {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="dryRun"
              checked={settings.dryRun}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dryRun: checked }))}
              disabled={isActive}
            />
            <Label htmlFor="dryRun">Dry Run (alleen testen, geen echte generatie)</Label>
          </div>
        </div>

        <Separator />

        {/* Status Info with Problem Detection */}
        {status && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Huidige Status Details:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-mono">{status.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Items in wachtrij:</span>
                <span className="ml-2 font-mono">{status.queue_pending || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Verwerkt:</span>
                <span className="ml-2 font-mono">{status.processed_items || 0} / {status.total_items || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Succesvol:</span>
                <span className="ml-2 font-mono">{status.successful_items || 0}</span>
              </div>
            </div>
            
            {status.status === 'completed' && (status.processed_items || 0) === 0 && (status.queue_pending || 0) > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-700 text-sm font-medium">
                  ⚠️ Probleem gedetecteerd: Batch is gemarkeerd als voltooid maar er zijn nog {status.queue_pending} items in de wachtrij die niet verwerkt zijn.
                </p>
                <p className="text-orange-600 text-xs mt-1">
                  Gebruik "Repareer Status" om de batch opnieuw te activeren.
                </p>
              </div>
            )}
            
            {(status.queue_failed || 0) > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ {status.queue_failed} items zijn mislukt tijdens verwerking
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Gebruik "Probeer Mislukte Items Opnieuw" om deze items opnieuw te verwerken.
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {/* Fix batch status if stuck in running or completed with pending items */}
          {(status.status === 'running' || 
            (status.status === 'completed' && (status.processed_items || 0) === 0 && (status.queue_pending || 0) > 0)) && (
            <Button
              onClick={fixBatchStatus}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 border-yellow-500 text-yellow-700"
            >
              <AlertTriangle className="h-4 w-4" />
              Repareer Status
            </Button>
          )}

          <Button
            onClick={startBatch}
            disabled={isLoading || !canStart}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {settings.dryRun ? 'Test Run' : 'Start Automatische Generatie'}
          </Button>
          
          {canRetryFailed && (
            <Button
              onClick={retryFailedItems}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 border-orange-500 text-orange-700"
            >
              <RotateCcw className="h-4 w-4" />
              Probeer Mislukte Items Opnieuw ({status.queue_failed})
            </Button>
          )}
          
          {canPause && (
            <Button
              onClick={pauseBatch}
              disabled={isLoading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pauzeer
            </Button>
          )}

          {canResume && (
            <Button
              onClick={resumeBatch}
              disabled={isLoading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Hervat
            </Button>
          )}
          
          {(isActive || isPaused) && (
            <Button
              onClick={stopAllBatches}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Alles
            </Button>
          )}
        </div>

        {/* Dry Run Results */}
        {dryRunResult && (
          <Card>
            <CardHeader>
              <CardTitle>Dry Run Resultaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Items Gevonden</p>
                  <p className="text-2xl font-bold">{dryRunResult.itemsFound}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {status.status !== 'idle' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voortgang</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voortgang: {status.processed_items || 0} / {status.total_items || 0}</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Succesvol</p>
                <p className="text-xl font-bold text-green-600">{status.successful_items || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mislukt</p>
                <p className="text-xl font-bold text-red-600">{status.failed_items || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wachtend</p>
                <p className="text-xl font-bold text-blue-600">{status.queue_pending || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bezig</p>
                <p className="text-xl font-bold text-yellow-600">{status.queue_processing || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Klaar</p>
                <p className="text-xl font-bold text-green-600">{status.queue_completed || 0}</p>
              </div>
            </div>

            {/* Current Item */}
            {status.current_item && (
              <div>
                <p className="text-sm font-medium mb-2">Huidig Item:</p>
                <p className="text-sm text-muted-foreground">• {status.current_item}</p>
              </div>
            )}

            {/* Heartbeat Info */}
            {status.last_heartbeat && (
              <div>
                <p className="text-sm font-medium mb-1">Laatste Activiteit:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(status.last_heartbeat).toLocaleString()}
                </p>
              </div>
            )}

            {/* Timing Info */}
            {status.started_at && (
              <div className="text-sm text-muted-foreground">
                <p>Gestart: {new Date(status.started_at).toLocaleString()}</p>
                {status.completed_at && (
                  <p>Voltooid: {new Date(status.completed_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🤖 Automatische Verwerking</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Cron job draait elke minuut automatisch</li>
            <li>• Verwerkt 1 item per keer voor maximum stabiliteit</li>
            <li>• Loopt door onafhankelijk van je browser sessie</li>
            <li>• Heartbeat toont laatste activiteit van de processor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}