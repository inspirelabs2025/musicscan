import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Play, Square, RotateCcw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BatchStatus {
  id?: string;
  status: 'idle' | 'running' | 'completed' | 'stopped';
  total_items?: number;
  processed_items?: number;
  successful_items?: number;
  failed_items?: number;
  current_batch?: number;
  current_items?: string[];
  started_at?: string;
  completed_at?: string;
  failed_details?: Array<{ item: any; error: string }>;
}

export function BatchBlogGenerator() {
  const [status, setStatus] = useState<BatchStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [settings, setSettings] = useState({
    batchSize: 3,
    delaySeconds: 45,
    mediaTypes: ['cd', 'vinyl', 'ai'],
    minConfidence: 0.7,
    dryRun: false
  });
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'status' }
      });

      if (error) throw error;
      setStatus(data);
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
          description: `${data.itemsFound} items gevonden. Geschatte tijd: ${Math.floor(data.estimatedTime / 60)} minuten.`
        });
      } else {
        toast({
          title: "Batch Generatie Gestart",
          description: `${data.totalItems} items worden verwerkt. Geschatte tijd: ${Math.floor(data.estimatedTime / 60)} minuten.`
        });
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
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('batch-blog-generator', {
        body: { action: 'stop' }
      });

      if (error) throw error;

      toast({
        title: "Batch Gestopt",
        description: "Batch generatie is gestopt."
      });
    } catch (error) {
      console.error('Failed to stop batch:', error);
      toast({
        title: "Fout bij Stoppen",
        description: "Kon batch generatie niet stoppen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'stopped': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RotateCcw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'stopped': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const progressPercentage = status.total_items 
    ? Math.round((status.processed_items || 0) / status.total_items * 100) 
    : 0;

  const estimatedTimeRemaining = status.total_items && status.processed_items && status.status === 'running'
    ? Math.ceil(((status.total_items - status.processed_items) / settings.batchSize) * settings.delaySeconds / 60)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Batch Blog Generator
          <Badge variant="outline" className={getStatusColor(status.status)}>
            {getStatusIcon(status.status)}
            {status.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Instellingen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Grootte</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="10"
                value={settings.batchSize}
                onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 3 }))}
                disabled={status.status === 'running'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delay">Vertraging (seconden)</Label>
              <Input
                id="delay"
                type="number"
                min="10"
                max="120"
                value={settings.delaySeconds}
                onChange={(e) => setSettings(prev => ({ ...prev, delaySeconds: parseInt(e.target.value) || 45 }))}
                disabled={status.status === 'running'}
              />
            </div>
            
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
                disabled={status.status === 'running'}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="dryRun"
              checked={settings.dryRun}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dryRun: checked }))}
              disabled={status.status === 'running'}
            />
            <Label htmlFor="dryRun">Dry Run (alleen testen, geen echte generatie)</Label>
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={startBatch}
            disabled={isLoading || status.status === 'running'}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {settings.dryRun ? 'Test Run' : 'Start Generatie'}
          </Button>
          
          {status.status === 'running' && (
            <Button
              onClick={stopBatch}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
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
                <div>
                  <p className="text-sm text-muted-foreground">Geschatte Tijd</p>
                  <p className="text-2xl font-bold">{Math.floor(dryRunResult.estimatedTime / 60)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geschatte Kosten</p>
                  <p className="text-2xl font-bold">€{dryRunResult.estimatedCost?.toFixed(0)}</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Succesvol</p>
                <p className="text-xl font-bold text-green-600">{status.successful_items || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mislukt</p>
                <p className="text-xl font-bold text-red-600">{status.failed_items || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Huidige Batch</p>
                <p className="text-xl font-bold">{status.current_batch || 0}</p>
              </div>
              {status.status === 'running' && estimatedTimeRemaining > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Resterende Tijd</p>
                  <p className="text-xl font-bold">{estimatedTimeRemaining}m</p>
                </div>
              )}
            </div>

            {/* Current Items */}
            {status.current_items && status.current_items.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Huidige Items:</p>
                <div className="space-y-1">
                  {status.current_items.map((item, index) => (
                    <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Items */}
            {status.failed_details && status.failed_details.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-red-600">Mislukte Items:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {status.failed_details.map((failed, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{failed.item.artist} - {failed.item.title}</p>
                      <p className="text-red-600 text-xs">{failed.error}</p>
                    </div>
                  ))}
                </div>
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
      </CardContent>
    </Card>
  );
}