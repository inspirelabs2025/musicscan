import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BatchStatus {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at: string;
  last_heartbeat: string;
  queue_stats?: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

const ArtistStoriesGenerator = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBatchStatus();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const loadBatchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('artist-stories-batch-processor', {
        body: { action: 'status' }
      });

      if (error) throw error;
      if (data) {
        setBatchStatus(data);
        setIsProcessing(data.status === 'processing');
      }
    } catch (error: any) {
      console.error('Error loading batch status:', error);
    }
  };

  const startProcessing = async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('artist-stories-batch-processor', {
        body: { action: 'start' }
      });

      if (error) throw error;

      toast({
        title: "Batch Processing Gestart",
        description: `${data.total} artiesten worden automatisch verwerkt door de cron job (1 per minuut)`,
      });

      // Start polling for status updates
      const id = setInterval(loadBatchStatus, 5000);
      setIntervalId(id);

    } catch (error: any) {
      console.error('Error starting batch:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon batch niet starten",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    toast({
      title: "Processing Gestopt",
      description: "Batch processing is handmatig gestopt",
    });
  };

  const retryFailed = async () => {
    try {
      toast({
        title: "Retry Gestart",
        description: "Gefaalde items worden opnieuw verwerkt...",
      });

      const { data, error } = await supabase.functions.invoke('artist-stories-batch-processor', {
        body: { action: 'retry_failed' }
      });

      if (error) throw error;

      toast({
        title: "Retry Succesvol",
        description: `${data.resetCount} items zijn teruggezet naar pending`,
      });

      // Reload status
      await loadBatchStatus();

    } catch (error: any) {
      console.error('Error retrying failed items:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon gefaalde items niet opnieuw proberen",
        variant: "destructive"
      });
    }
  };

  const progress = batchStatus 
    ? (batchStatus.processed_items / batchStatus.total_items) * 100 
    : 0;

  const estimatedTimeRemaining = batchStatus && batchStatus.queue_stats
    ? Math.ceil(batchStatus.queue_stats.pending / 1) // 1 per minute
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Music className="w-10 h-10 text-primary" />
            Artiest Verhalen Generator
          </h1>
          <p className="text-muted-foreground">
            Genereer automatisch verhalen voor alle artiesten in de album queue
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Batch Processing Controles</CardTitle>
            <CardDescription>
              Start het generatie proces of stop het indien nodig
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {!isProcessing ? (
                <Button onClick={startProcessing} size="lg" className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Batch Processing
                </Button>
              ) : (
                <Button onClick={stopProcessing} variant="destructive" size="lg" className="flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Processing
                </Button>
              )}
              
              <Button onClick={loadBatchStatus} variant="outline" size="lg">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {batchStatus && batchStatus.failed_items > 0 && (
              <Button onClick={retryFailed} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry {batchStatus.failed_items} Gefaalde Items
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Progress Card */}
        {batchStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Voortgang</span>
                <Badge variant={
                  batchStatus.status === 'completed' ? 'default' :
                  batchStatus.status === 'processing' ? 'secondary' :
                  'destructive'
                }>
                  {batchStatus.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {batchStatus.processed_items} van {batchStatus.total_items} artiesten verwerkt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress.toFixed(1)}% voltooid
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Wachtend</span>
                  </div>
                  <p className="text-2xl font-bold">{batchStatus.queue_stats?.pending || 0}</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Verwerken</span>
                  </div>
                  <p className="text-2xl font-bold">{batchStatus.queue_stats?.processing || 0}</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Voltooid</span>
                  </div>
                  <p className="text-2xl font-bold">{batchStatus.successful_items}</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Mislukt</span>
                  </div>
                  <p className="text-2xl font-bold">{batchStatus.failed_items}</p>
                </div>
              </div>

              {/* Time Estimate */}
              {estimatedTimeRemaining > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Geschatte resterende tijd</p>
                  <p className="text-xl font-bold">
                    {estimatedTimeRemaining} minuten
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>⚡ Verwerkingssnelheid: 1 artiest per minuut</p>
                <p>🤖 AI Model: Gemini 2.5 Flash</p>
                <p>📊 Laatste update: {new Date(batchStatus.last_heartbeat).toLocaleTimeString('nl-NL')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Hoe werkt het?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Artiesten detecteren:</strong> Het systeem haalt alle unieke artiesten op uit de album import queue.
            </p>
            <p>
              <strong>2. Batch verwerking:</strong> Voor elke artiest wordt een uitgebreid verhaal gegenereerd met AI (800-1000 woorden).
            </p>
            <p>
              <strong>3. Artwork ophalen:</strong> Probeert automatisch artiest foto's op te halen van Discogs.
            </p>
            <p>
              <strong>4. Publicatie:</strong> Voltooide verhalen worden direct gepubliceerd op /artists
            </p>
            <p className="text-muted-foreground">
              <strong>Let op:</strong> Dit proces kan enkele uren duren voor 231 artiesten. Het systeem verwerkt 1 artiest per minuut om rate limits te respecteren.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArtistStoriesGenerator;
