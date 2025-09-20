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

interface BatchStatus {
  id?: string;
  status: 'idle' | 'active' | 'paused' | 'completed' | 'failed' | 'stopped';
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
    mediaTypes: ['cd', 'vinyl', 'ai'],
    minConfidence: 0.7,
    dryRun: false
  });
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status.status === 'active') {
      interval = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
            body: { action: 'status' }
          });
          
          if (!error && data) {
            setStatus(data);
            setLastUpdate(new Date());
            
            // Auto-cleanup stuck batches (if no heartbeat for 5+ minutes)
            if (data.last_heartbeat) {
              const lastHeartbeat = new Date(data.last_heartbeat);
              const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
              
              if (timeSinceHeartbeat > 5 * 60 * 1000) { // 5 minutes
                toast({
                  title: "Batch mogelijk gestopt",
                  description: "De automatische verwerking lijkt gestopt. Cron job mogelijk inactief.",
                  variant: "destructive"
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking batch status:', error);
        }
      }, 10000); // Check every 10 seconds for active batches
    } else {
      checkStatus();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.status]);

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'status' }
      });

      if (error) throw error;
      setStatus(data || { status: 'idle' });
    } catch (error) {
      console.error('Failed to check batch status:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
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

  return (
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

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={startBatch}
            disabled={isLoading || !canStart}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {settings.dryRun ? 'Test Run' : 'Start Automatische Generatie'}
          </Button>
          
          {canPause && (
            <Button
              onClick={stopBatch}
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
              onClick={forceStopBatch}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Force Stop
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
  );
}