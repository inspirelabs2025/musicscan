import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useClientVideoGenerator, VideoStyle, ZoomEffect } from '@/hooks/useClientVideoGenerator';
import { Loader2, Play, Pause, CheckCircle, XCircle, Video, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  blog_id: string | null;
  album_cover_url: string;
  artist: string;
  title: string;
  status: string;
  video_url: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
}

interface VideoQueueProcessorProps {
  style?: VideoStyle;
  zoomEffect?: ZoomEffect;
  durationPerImage?: number;
}

export const VideoQueueProcessor: React.FC<VideoQueueProcessorProps> = ({
  style = 'blurred-background',
  zoomEffect = 'grow-in-out',
  durationPerImage = 3
}) => {
  const queryClient = useQueryClient();
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const processingRef = useRef(false);

  // Load auto-processing setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('video-auto-processing');
    if (saved === 'true') {
      setIsAutoProcessing(true);
    }
  }, []);

  const { generateVideo, uploadVideo, isGenerating, progress } = useClientVideoGenerator();

  // Fetch ready_for_client OR stuck processing items (older than 5 min)
  const { data: readyItems = [], refetch } = useQuery({
    queryKey: ['video-queue-ready'],
    queryFn: async () => {
      // Get ready_for_client items
      const { data: readyData, error: readyError } = await supabase
        .from('tiktok_video_queue')
        .select('*')
        .eq('status', 'ready_for_client')
        .order('created_at', { ascending: true })
        .limit(50);

      if (readyError) throw readyError;
      
      // Also get stuck processing items (older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stuckData, error: stuckError } = await supabase
        .from('tiktok_video_queue')
        .select('*')
        .eq('status', 'processing')
        .lt('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: true })
        .limit(10);

      if (stuckError) throw stuckError;
      
      // Combine and dedupe
      const allItems = [...(readyData || []), ...(stuckData || [])];
      return allItems as QueueItem[];
    },
    refetchInterval: isAutoProcessing ? 5000 : 30000,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['video-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_video_queue')
        .select('status');

      if (error) throw error;

      const counts = {
        pending: 0,
        ready_for_client: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      (data || []).forEach((item: { status: string }) => {
        if (item.status in counts) {
          counts[item.status as keyof typeof counts]++;
        }
      });

      return counts;
    },
    refetchInterval: 5000,
  });

  // Process single item
  const processItem = useCallback(async (item: QueueItem): Promise<boolean> => {
    console.log(`Processing: ${item.artist} - ${item.title}`);
    setCurrentItem(item);

    try {
      // Mark as processing
      await supabase
        .from('tiktok_video_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      // Generate video
      const result = await generateVideo({
        images: [item.album_cover_url],
        style,
        zoomEffect,
        durationPerImage
      });

      // Upload to storage
      const filename = `${item.artist}_${item.title}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const publicUrl = await uploadVideo(result.blob, filename);

      // Update queue item as completed
      await supabase
        .from('tiktok_video_queue')
        .update({
          status: 'completed',
          video_url: publicUrl,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      // Update blog post if blog_id exists
      if (item.blog_id) {
        await supabase
          .from('blog_posts')
          .update({ tiktok_video_url: publicUrl })
          .eq('id', item.blog_id);
      }

      console.log(`Completed: ${item.artist} - ${item.title}`);
      setProcessedCount(prev => prev + 1);
      return true;

    } catch (error: any) {
      console.error(`Failed: ${item.artist} - ${item.title}`, error);

      await supabase
        .from('tiktok_video_queue')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
          attempts: item.attempts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      setFailedCount(prev => prev + 1);
      return false;
    } finally {
      setCurrentItem(null);
      queryClient.invalidateQueries({ queryKey: ['video-queue-ready'] });
      queryClient.invalidateQueries({ queryKey: ['video-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
    }
  }, [generateVideo, uploadVideo, style, zoomEffect, durationPerImage, queryClient]);

  // Auto-process loop
  useEffect(() => {
    if (!isAutoProcessing || processingRef.current || isGenerating) return;

    const nextItem = readyItems[0];
    if (!nextItem) return;

    processingRef.current = true;
    processItem(nextItem).finally(() => {
      processingRef.current = false;
    });
  }, [isAutoProcessing, readyItems, isGenerating, processItem]);

  // Mark pending items as ready
  const markPendingAsReady = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mark-videos-ready');
      if (error) throw error;
      toast.success(`${data.markedCount || 0} items gemarkeerd als klaar voor verwerking`);
      refetch();
    } catch (error: any) {
      toast.error(`Fout: ${error.message}`);
    }
  };

  // Process single item manually
  const handleProcessSingle = async () => {
    const nextItem = readyItems[0];
    if (!nextItem) {
      toast.error('Geen items beschikbaar');
      return;
    }
    await processItem(nextItem);
  };

  const toggleAutoProcessing = () => {
    const newValue = !isAutoProcessing;
    setIsAutoProcessing(newValue);
    // Save to localStorage
    localStorage.setItem('video-auto-processing', String(newValue));
    if (newValue) {
      toast.success('Auto-processing gestart - wacht op items in queue');
    } else {
      toast.info('Auto-processing gepauzeerd');
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Client-Side Queue Processor
        </CardTitle>
        <CardDescription>
          Automatische verwerking van video's in de browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-2 bg-blue-500/20 rounded-lg">
            <div className="text-2xl font-bold">{stats?.ready_for_client || 0}</div>
            <div className="text-xs text-muted-foreground">Ready</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/20 rounded-lg">
            <div className="text-2xl font-bold">{stats?.processing || 0}</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center p-2 bg-green-500/20 rounded-lg">
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-2 bg-red-500/20 rounded-lg">
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Current Processing */}
        {currentItem && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="font-medium">Nu aan het verwerken:</span>
            </div>
            <div className="flex items-center gap-3">
              <img 
                src={currentItem.album_cover_url} 
                alt={currentItem.title}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <div className="font-medium">{currentItem.artist}</div>
                <div className="text-sm text-muted-foreground">{currentItem.title}</div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(progress)}% voltooid
            </div>
          </div>
        )}

        {/* Session Stats */}
        {(processedCount > 0 || failedCount > 0) && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="w-4 h-4" />
              {processedCount} verwerkt
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" />
                {failedCount} mislukt
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={markPendingAsReady}
            disabled={isGenerating}
          >
            Markeer Pending als Ready
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessSingle}
            disabled={isGenerating || readyItems.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Video className="w-4 h-4 mr-2" />
            )}
            Verwerk 1 Item
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="auto-process"
              checked={isAutoProcessing}
              onCheckedChange={toggleAutoProcessing}
              disabled={isGenerating && !isAutoProcessing}
            />
            <Label htmlFor="auto-process" className="flex items-center gap-2">
              {isAutoProcessing ? (
                <>
                  <Pause className="w-4 h-4" />
                  Auto-Processing Actief
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Auto-Processing
                </>
              )}
            </Label>
          </div>
        </div>

        {/* Queue Preview */}
        {readyItems.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Volgende in queue ({readyItems.length}):</div>
            <div className="flex flex-wrap gap-2">
              {readyItems.slice(0, 5).map((item) => (
                <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
                  <img 
                    src={item.album_cover_url} 
                    alt={item.title}
                    className="w-4 h-4 object-cover rounded"
                  />
                  {item.artist.substring(0, 15)}
                </Badge>
              ))}
              {readyItems.length > 5 && (
                <Badge variant="outline">+{readyItems.length - 5} meer</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
