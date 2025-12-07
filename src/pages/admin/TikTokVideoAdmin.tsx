import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Video, CheckCircle, XCircle, Clock, Play, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TikTokQueueItem {
  id: string;
  blog_id: string;
  album_cover_url: string;
  status: string;
  operation_name: string | null;
  video_url: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export default function TikTokVideoAdmin() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch queue items
  const { data: queueItems, isLoading, refetch } = useQuery({
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
    refetchInterval: 10000, // Refresh every 10 seconds
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
        total: data.length,
      };
      
      data.forEach((item: { status: string }) => {
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
      toast.success(`Queue verwerkt: ${data.processedCount || 0} items`);
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-queue'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-video-stats'] });
    },
    onError: (error) => {
      toast.error(`Fout bij verwerken: ${error.message}`);
    },
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TikTok Video Generator</h1>
          <p className="text-muted-foreground">
            Beheer video generatie met Google Veo 2 voor TikTok content
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
          ) : queueItems?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen video's in de queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pogingen</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Fout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems?.map((item) => (
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
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.attempts}/3</TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd MMM HH:mm', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {item.video_url ? (
                        <a 
                          href={item.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Bekijk
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.error_message ? (
                        <span className="text-destructive text-sm" title={item.error_message}>
                          {item.error_message}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
