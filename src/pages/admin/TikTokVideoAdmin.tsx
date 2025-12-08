import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Video, CheckCircle, XCircle, Clock, Play, ExternalLink, Eye, RotateCcw, StopCircle, Upload, Download, TestTube, Zap, Music, Disc } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useClientVideoGenerator, VideoStyle, ZoomEffect } from '@/hooks/useClientVideoGenerator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoQueueProcessor } from '@/components/admin/video/VideoQueueProcessor';

interface TikTokQueueItem {
  id: string;
  blog_id: string | null;
  music_story_id: string | null;
  album_cover_url: string;
  artist: string | null;
  title: string | null;
  status: string;
  priority: number;
  operation_name: string | null;
  video_url: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

// Safe date formatter to prevent "Invalid time value" errors
const safeFormatDate = (dateStr: string | null | undefined, formatStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatStr, { locale: nl });
  } catch {
    return '-';
  }
};

export default function TikTokVideoAdmin() {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<TikTokQueueItem | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [queueTab, setQueueTab] = useState<'pending' | 'completed' | 'failed'>('completed');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'album' | 'single'>('all');

  // Realtime subscription for immediate updates
  useEffect(() => {
    const channel = supabase
      .channel('tiktok-queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tiktok_video_queue' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch queue items
  const { data: queueItems = [], isLoading, refetch } = useQuery({
    queryKey: ['tiktok-video-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_video_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as TikTokQueueItem[];
    },
    refetchInterval: 10000,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['tiktok-video-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_video_queue')
        .select('status');
      
      if (error) throw error;
      
      const counts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: data?.length || 0,
      };
      
      (data || []).forEach((item: { status: string }) => {
        if (item.status in counts) {
          counts[item.status as keyof typeof counts]++;
        }
      });
      
      return counts;
    },
    refetchInterval: 10000,
  });

  // Trigger manual processing
  const triggerProcessing = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-tiktok-video-queue');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Queue verwerkt: ${data?.processedCount || 0} items`);
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Fout bij verwerken: ${error.message}`);
    },
  });

  // Retry failed item
  const retryItem = useMutation({
    mutationFn: async (item: TikTokQueueItem) => {
      const { error } = await supabase
        .from('tiktok_video_queue')
        .update({ 
          status: 'pending', 
          attempts: 0, 
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item opnieuw in queue geplaatst');
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Fout bij retry: ${error.message}`);
    },
  });

  // Stop all pending/processing items
  const stopQueue = useMutation({
    mutationFn: async () => {
      console.log('Stopping queue - updating pending/processing items to failed');
      const { data, error, count } = await supabase
        .from('tiktok_video_queue')
        .update({ 
          status: 'failed', 
          error_message: 'Handmatig gestopt door admin',
          updated_at: new Date().toISOString()
        })
        .in('status', ['pending', 'processing'])
        .select();
      
      console.log('Stop queue result:', { data, error, count });
      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      toast.success(`Queue gestopt - ${count} items geannuleerd`);
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
    },
    onError: (error: Error) => {
      console.error('Stop queue error:', error);
      toast.error(`Fout bij stoppen queue: ${error.message}`);
    },
  });

  const openVideoPreview = (item: TikTokQueueItem) => {
    setSelectedVideo(item);
    setVideoDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Wachtend</Badge>;
      case 'ready_for_client':
        return <Badge variant="default" className="bg-purple-500"><Zap className="w-3 h-3 mr-1" /> Klaar</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Bezig</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Voltooid</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Mislukt</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-orange-500 border-orange-500"><StopCircle className="w-3 h-3 mr-1" /> Geannuleerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Client-side video generator
  const { generateVideo, uploadVideo, isGenerating, progress } = useClientVideoGenerator();
  const [testImages, setTestImages] = useState<string[]>([]);
  const [testImageInput, setTestImageInput] = useState('');
  const [testStyle, setTestStyle] = useState<VideoStyle>('blurred-background');
  const [testZoomEffect, setTestZoomEffect] = useState<ZoomEffect>('grow-in-out');
  const [testDuration, setTestDuration] = useState(3);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleAddTestImage = () => {
    if (testImageInput.trim()) {
      setTestImages(prev => [...prev, testImageInput.trim()]);
      setTestImageInput('');
    }
  };

  const handleGenerateTestVideo = async () => {
    if (testImages.length === 0) {
      toast.error('Voeg minimaal 1 afbeelding toe');
      return;
    }

    try {
      const result = await generateVideo({
        images: testImages,
        style: testStyle,
        zoomEffect: testZoomEffect,
        durationPerImage: testDuration
      });

      setGeneratedVideoUrl(result.videoUrl);
      toast.success('Video gegenereerd!');
    } catch (error: any) {
      toast.error(`Fout: ${error.message}`);
    }
  };

  const handleUploadAndSave = async () => {
    if (!generatedVideoUrl) return;

    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const publicUrl = await uploadVideo(blob, `test_${Date.now()}`);
      toast.success(`Video opgeslagen: ${publicUrl}`);
    } catch (error: any) {
      toast.error(`Upload fout: ${error.message}`);
    }
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TikTok Video Generator</h1>
          <p className="text-muted-foreground">
            Client-side video generatie voor TikTok/Reels content (1080×1920)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
          <Button 
            variant="destructive"
            onClick={() => stopQueue.mutate()}
            disabled={stopQueue.isPending || ((stats?.pending || 0) + (stats?.processing || 0) === 0)}
          >
            {stopQueue.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <StopCircle className="w-4 h-4 mr-2" />
            )}
            Stop Queue
          </Button>
          <Button 
            onClick={() => triggerProcessing.mutate()}
            disabled={triggerProcessing.isPending}
          >
            {triggerProcessing.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Verwerk Queue
          </Button>
        </div>
      </div>

      {/* Client-Side Queue Processor */}
      <VideoQueueProcessor 
        style={testStyle}
        zoomEffect={testZoomEffect}
        durationPerImage={testDuration}
      />

      {/* Client-Side Video Test Section */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            🎬 Client-Side Video Test
          </CardTitle>
          <CardDescription>
            Test de client-side video generator met afbeeldingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload afbeeldingen</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setTestImages(prev => [...prev, ev.target!.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Klik of sleep afbeeldingen hierheen</p>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setTestImages(prev => [...prev, ev.target!.result as string]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label>Of voeg URL toe</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={testImageInput}
                    onChange={(e) => setTestImageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTestImage()}
                  />
                  <Button onClick={handleAddTestImage} size="icon" variant="outline">
                    +
                  </Button>
                </div>
              </div>

              {testImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Afbeeldingen ({testImages.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {testImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Test ${idx}`} className="w-16 h-16 object-cover rounded" />
                        <button
                          onClick={() => setTestImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setTestImages([])}
                    className="text-xs text-muted-foreground"
                  >
                    Alles wissen
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={testStyle} onValueChange={(v) => setTestStyle(v as VideoStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contain">Contain (padding)</SelectItem>
                      <SelectItem value="cover">Cover (crop)</SelectItem>
                      <SelectItem value="blurred-background">Blurred Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zoom Effect</Label>
                  <Select value={testZoomEffect} onValueChange={(v) => setTestZoomEffect(v as ZoomEffect)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen</SelectItem>
                      <SelectItem value="grow-in">Grow In (klein → groot)</SelectItem>
                      <SelectItem value="grow-out">Grow Out (groot → klein)</SelectItem>
                      <SelectItem value="grow-in-out">Grow In-Out (puls)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seconden per afbeelding</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  className="w-24"
                />
              </div>

              <Button
                onClick={handleGenerateTestVideo}
                disabled={isGenerating || testImages.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Genereren... ({Math.round(progress)}%)
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Genereer Video
                  </>
                )}
              </Button>

              {isGenerating && (
                <Progress value={progress} className="h-2" />
              )}
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <Label>Video Preview (1080×1920 → geschaald)</Label>
              <div className="bg-muted rounded-lg aspect-[9/16] max-h-[400px] flex items-center justify-center overflow-hidden">
                {generatedVideoUrl ? (
                  <video
                    ref={videoRef}
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-center p-4">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Video preview verschijnt hier</p>
                  </div>
                )}
              </div>
              
              {generatedVideoUrl && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={generatedVideoUrl} download="tiktok-video.webm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button onClick={handleUploadAndSave} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload naar Storage
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totaal</CardDescription>
            <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wachtend</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats?.pending || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bezig</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{stats?.processing || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Voltooid</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats?.completed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mislukt</CardDescription>
            <CardTitle className="text-2xl text-destructive">{stats?.failed || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Queue
              </CardTitle>
              <CardDescription>
                Bekijk gegenereerde GIF's en queue status
              </CardDescription>
            </div>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as 'all' | 'album' | 'single')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter bron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle bronnen</SelectItem>
                <SelectItem value="album">💿 Albums</SelectItem>
                <SelectItem value="single">🎵 Singles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={queueTab} onValueChange={(v) => setQueueTab(v as 'pending' | 'completed' | 'failed')}>
            <TabsList className="mb-4">
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Voltooid ({stats?.completed || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Wachtrij ({(stats?.pending || 0) + (stats?.processing || 0)})
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Mislukt ({stats?.failed || 0})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Completed Tab - Grid with GIF previews */}
                <TabsContent value="completed" className="mt-0">
                  {(() => {
                    const completedItems = queueItems
                      .filter(item => item.status === 'completed')
                      .filter(item => {
                        if (sourceFilter === 'all') return true;
                        if (sourceFilter === 'album') return !!item.blog_id && !item.music_story_id;
                        if (sourceFilter === 'single') return !!item.music_story_id;
                        return true;
                      });
                    
                    if (completedItems.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          Nog geen voltooide GIF's
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {completedItems.map((item) => {
                          const sourceType = item.music_story_id ? 'single' : item.blog_id ? 'album' : 'manual';
                          return (
                            <div 
                              key={item.id} 
                              className="group relative bg-card border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => openVideoPreview(item)}
                            >
                              {/* GIF/Video Preview */}
                              <div className="aspect-[9/16] bg-muted relative">
                                {item.video_url ? (
                                  item.video_url.toLowerCase().endsWith('.gif') ? (
                                    <img 
                                      src={item.video_url} 
                                      alt={`${item.artist} - ${item.title}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <video 
                                      src={item.video_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      loop
                                      onMouseEnter={(e) => e.currentTarget.play()}
                                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                  )
                                ) : item.album_cover_url ? (
                                  <img 
                                    src={item.album_cover_url} 
                                    alt={`${item.artist} - ${item.title}`}
                                    className="w-full h-full object-cover opacity-50"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Source Badge */}
                                <div className="absolute top-2 left-2">
                                  <Badge variant={sourceType === 'single' ? 'default' : 'secondary'} className="text-xs">
                                    {sourceType === 'single' ? (
                                      <><Music className="w-3 h-3 mr-1" /> Single</>
                                    ) : (
                                      <><Disc className="w-3 h-3 mr-1" /> Album</>
                                    )}
                                  </Badge>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                                </div>
                              </div>

                              {/* Info */}
                              <div className="p-3 space-y-1">
                                <p className="font-medium text-sm truncate">{item.artist || 'Onbekend'}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.title || 'Zonder titel'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {safeFormatDate(item.processed_at || item.updated_at, 'dd MMM HH:mm')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* Pending Tab - Table view */}
                <TabsContent value="pending" className="mt-0">
                  {(() => {
                    const pendingItems = queueItems
                      .filter(item => item.status === 'pending' || item.status === 'processing' || item.status === 'ready_for_client')
                      .filter(item => {
                        if (sourceFilter === 'all') return true;
                        if (sourceFilter === 'album') return !!item.blog_id && !item.music_story_id;
                        if (sourceFilter === 'single') return !!item.music_story_id;
                        return true;
                      });
                    
                    if (pendingItems.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          Geen items in de wachtrij
                        </div>
                      );
                    }

                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cover</TableHead>
                            <TableHead>Bron</TableHead>
                            <TableHead>Artiest</TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aangemaakt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingItems.slice(0, 50).map((item) => {
                            const sourceType = item.music_story_id ? 'single' : item.blog_id ? 'album' : 'manual';
                            const sourceLabel = sourceType === 'single' ? '🎵 Single' : sourceType === 'album' ? '💿 Album' : '📷 Handmatig';
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {item.album_cover_url && (
                                    <img src={item.album_cover_url} alt="Cover" className="w-10 h-10 object-cover rounded" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sourceType === 'single' ? 'default' : 'secondary'}>{sourceLabel}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{item.artist || '-'}</TableCell>
                                <TableCell>{item.title || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={item.priority >= 100 ? 'default' : 'outline'}>{item.priority}</Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell>{safeFormatDate(item.created_at, 'dd MMM HH:mm')}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </TabsContent>

                {/* Failed Tab - Table with retry */}
                <TabsContent value="failed" className="mt-0">
                  {(() => {
                    const failedItems = queueItems
                      .filter(item => item.status === 'failed')
                      .filter(item => {
                        if (sourceFilter === 'all') return true;
                        if (sourceFilter === 'album') return !!item.blog_id && !item.music_story_id;
                        if (sourceFilter === 'single') return !!item.music_story_id;
                        return true;
                      });
                    
                    if (failedItems.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          Geen mislukte items
                        </div>
                      );
                    }

                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cover</TableHead>
                            <TableHead>Bron</TableHead>
                            <TableHead>Artiest</TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Foutmelding</TableHead>
                            <TableHead>Pogingen</TableHead>
                            <TableHead>Actie</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {failedItems.map((item) => {
                            const sourceType = item.music_story_id ? 'single' : item.blog_id ? 'album' : 'manual';
                            const sourceLabel = sourceType === 'single' ? '🎵 Single' : sourceType === 'album' ? '💿 Album' : '📷 Handmatig';
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {item.album_cover_url && (
                                    <img src={item.album_cover_url} alt="Cover" className="w-10 h-10 object-cover rounded" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sourceType === 'single' ? 'default' : 'secondary'}>{sourceLabel}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{item.artist || '-'}</TableCell>
                                <TableCell>{item.title || '-'}</TableCell>
                                <TableCell>
                                  <span className="text-destructive text-xs max-w-[200px] truncate block" title={item.error_message || ''}>
                                    {item.error_message || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>{item.attempts}/{item.max_attempts}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => retryItem.mutate(item)}
                                    disabled={retryItem.isPending}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Retry
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Video Preview Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              {selectedVideo?.artist} - {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVideo?.video_url && (
              <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-lg overflow-hidden">
                {selectedVideo.video_url.toLowerCase().endsWith('.gif') ? (
                  <img 
                    src={selectedVideo.video_url} 
                    alt={`${selectedVideo.artist} - ${selectedVideo.title}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video 
                    src={selectedVideo.video_url} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    Je browser ondersteunt geen video afspelen.
                  </video>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {selectedVideo?.album_cover_url && (
                  <img 
                    src={selectedVideo.album_cover_url} 
                    alt="Album cover" 
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
              <div className="text-sm text-muted-foreground">
                  Gegenereerd: {safeFormatDate(selectedVideo?.processed_at || selectedVideo?.updated_at, 'dd MMM yyyy HH:mm')}
                </div>
              </div>
              {selectedVideo?.video_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in nieuw tabblad
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
