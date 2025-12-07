import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Video, CheckCircle, XCircle, Clock, Play, ExternalLink, Plus, PlusCircle, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface TikTokQueueItem {
  id: string;
  blog_id: string | null;
  album_cover_url: string;
  artist: string | null;
  title: string | null;
  status: string;
  operation_name: string | null;
  video_url: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

interface BlogPost {
  id: string;
  slug: string;
  album_cover_url: string | null;
  yaml_frontmatter: Record<string, unknown> | null;
  created_at: string;
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
  const [addingBlogIds, setAddingBlogIds] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<TikTokQueueItem | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Fetch queue items
  const { data: queueItems = [], isLoading, refetch } = useQuery({
    queryKey: ['tiktok-video-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_video_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as TikTokQueueItem[];
    },
    refetchInterval: 10000,
  });

  // Fetch blog posts without TikTok video
  const { data: availableBlogPosts = [], isLoading: loadingBlogs, refetch: refetchBlogs } = useQuery({
    queryKey: ['blogs-without-tiktok'],
    queryFn: async () => {
      // Get blog_ids already in queue
      const { data: queuedBlogs } = await supabase
        .from('tiktok_video_queue')
        .select('blog_id');
      
      const queuedBlogIds = new Set((queuedBlogs || []).map(q => q.blog_id).filter(Boolean));

      // Get blog posts with album_cover_url but no tiktok_video_url
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, album_cover_url, yaml_frontmatter, created_at')
        .is('tiktok_video_url', null)
        .not('album_cover_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Filter out blogs already in queue
      return (data as BlogPost[]).filter(blog => !queuedBlogIds.has(blog.id));
    },
    refetchInterval: 30000,
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

  // Add single blog to queue
  const addToQueue = useMutation({
    mutationFn: async (blog: BlogPost) => {
      const frontmatter = (blog.yaml_frontmatter || {}) as Record<string, string>;
      const artist = frontmatter.artist || 'Unknown Artist';
      const title = frontmatter.title || 'Unknown Title';

      const { data, error } = await supabase.functions.invoke('queue-tiktok-video', {
        body: {
          blogId: blog.id,
          albumCoverUrl: blog.album_cover_url,
          artist,
          title
        }
      });
      if (error) throw error;
      return { data, blog };
    },
    onMutate: async (blog) => {
      setAddingBlogIds(prev => new Set(prev).add(blog.id));
    },
    onSuccess: ({ blog }) => {
      const frontmatter = (blog.yaml_frontmatter || {}) as Record<string, string>;
      toast.success(`"${frontmatter.title || blog.slug}" toegevoegd aan queue`);
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
      queryClient.invalidateQueries({ queryKey: ['blogs-without-tiktok'] });
    },
    onError: (error: Error) => {
      toast.error(`Fout bij toevoegen: ${error.message}`);
    },
    onSettled: (_, __, blog) => {
      setAddingBlogIds(prev => {
        const next = new Set(prev);
        next.delete(blog.id);
        return next;
      });
    },
  });

  // Add all blogs to queue
  const addAllToQueue = useMutation({
    mutationFn: async () => {
      if (!availableBlogPosts || availableBlogPosts.length === 0) {
        throw new Error('Geen blog posts beschikbaar');
      }

      const results = [];
      for (const blog of availableBlogPosts) {
        const frontmatter = (blog.yaml_frontmatter || {}) as Record<string, string>;
        const artist = frontmatter.artist || 'Unknown Artist';
        const title = frontmatter.title || 'Unknown Title';

        try {
          const { error } = await supabase.functions.invoke('queue-tiktok-video', {
            body: {
              blogId: blog.id,
              albumCoverUrl: blog.album_cover_url,
              artist,
              title
            }
          });
          if (error) throw error;
          results.push({ success: true, blog });
        } catch (e) {
          results.push({ success: false, blog, error: e });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`${successCount} van ${results.length} blog posts toegevoegd aan queue`);
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
      queryClient.invalidateQueries({ queryKey: ['blogs-without-tiktok'] });
    },
    onError: (error: Error) => {
      toast.error(`Fout bij bulk toevoegen: ${error.message}`);
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

  const openVideoPreview = (item: TikTokQueueItem) => {
    setSelectedVideo(item);
    setVideoDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Wachtend</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Bezig</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Voltooid</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Mislukt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TikTok Video Generator</h1>
          <p className="text-muted-foreground">
            Beheer video generatie met Replicate Wan 2.5 voor TikTok content
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              refetch();
              refetchBlogs();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Vernieuwen
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

      {/* Available Blog Posts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Blog Posts zonder TikTok Video
              </CardTitle>
              <CardDescription>
                {availableBlogPosts.length} blog posts beschikbaar om toe te voegen
              </CardDescription>
            </div>
            {availableBlogPosts.length > 0 && (
              <Button 
                onClick={() => addAllToQueue.mutate()}
                disabled={addAllToQueue.isPending}
              >
                {addAllToQueue.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Voeg Alle Toe ({availableBlogPosts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingBlogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableBlogPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Alle blog posts hebben al een TikTok video of staan in de queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Artiest</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead>Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableBlogPosts.slice(0, 20).map((blog) => {
                  const frontmatter = (blog.yaml_frontmatter || {}) as Record<string, string>;
                  const isAdding = addingBlogIds.has(blog.id);
                  
                  return (
                    <TableRow key={blog.id}>
                      <TableCell>
                        {blog.album_cover_url && (
                          <img 
                            src={blog.album_cover_url} 
                            alt="Album cover" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {frontmatter.artist || '-'}
                      </TableCell>
                      <TableCell>
                        {frontmatter.title || blog.slug}
                      </TableCell>
                      <TableCell>
                        {safeFormatDate(blog.created_at, 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToQueue.mutate(blog)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Queue
          </CardTitle>
          <CardDescription>
            Recente video generatie opdrachten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen video's in de queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Artiest</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pogingen</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.album_cover_url && (
                        <img 
                          src={item.album_cover_url} 
                          alt="Album cover" 
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.artist || '-'}
                    </TableCell>
                    <TableCell>
                      {item.title || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.attempts}/{item.max_attempts}</TableCell>
                    <TableCell>
                      {safeFormatDate(item.created_at, 'dd MMM HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.video_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openVideoPreview(item)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Bekijk
                          </Button>
                        ) : item.status === 'failed' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryItem.mutate(item)}
                            disabled={retryItem.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        ) : item.error_message ? (
                          <span className="text-destructive text-xs max-w-[150px] truncate" title={item.error_message}>
                            {item.error_message}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
                <video 
                  src={selectedVideo.video_url} 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Je browser ondersteunt geen video afspelen.
                </video>
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
