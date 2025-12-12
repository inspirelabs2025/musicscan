import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Music, Image, ShoppingBag, Facebook } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ChristmasLogItem {
  id: string;
  artist: string;
  song_title: string;
  status: string;
  processed_at: string | null;
  error_message: string | null;
  music_story_id: string | null;
  product_ids: string[] | null;
}

interface MusicStory {
  id: string;
  artwork_url: string | null;
}

interface FacebookQueueItem {
  music_story_id: string;
  status: string;
  posted_at: string | null;
}

export default function ChristmasImportLogs() {
  // Fetch Christmas import queue
  const { data: queueItems, isLoading: loadingQueue } = useQuery({
    queryKey: ['christmas-import-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('christmas_import_queue')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ChristmasLogItem[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch music stories for artwork status
  const { data: musicStories } = useQuery({
    queryKey: ['christmas-music-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('id, artwork_url')
        .not('single_name', 'is', null);
      if (error) throw error;
      return data as MusicStory[];
    },
    refetchInterval: 30000,
  });

  // Fetch Facebook queue status
  const { data: fbQueue } = useQuery({
    queryKey: ['christmas-fb-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('singles_facebook_queue')
        .select('music_story_id, status, posted_at');
      if (error) throw error;
      return data as FacebookQueueItem[];
    },
    refetchInterval: 30000,
  });

  const getStoryStatus = (item: ChristmasLogItem) => {
    if (item.music_story_id) return 'done';
    if (item.status === 'processing') return 'processing';
    if (item.status === 'failed') return 'failed';
    return 'pending';
  };

  const getArtworkStatus = (item: ChristmasLogItem) => {
    if (!item.music_story_id) return 'pending';
    const story = musicStories?.find(s => s.id === item.music_story_id);
    return story?.artwork_url ? 'done' : 'missing';
  };

  const getProductStatus = (item: ChristmasLogItem) => {
    if (!item.product_ids || item.product_ids.length === 0) return 'pending';
    return 'done';
  };

  const getFacebookStatus = (item: ChristmasLogItem) => {
    if (!item.music_story_id) return 'pending';
    const fbItem = fbQueue?.find(f => f.music_story_id === item.music_story_id);
    if (!fbItem) return 'not_queued';
    if (fbItem.status === 'posted') return 'posted';
    if (fbItem.status === 'pending') return 'queued';
    return 'failed';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'done':
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'not_queued':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const stats = {
    total: queueItems?.length || 0,
    done: queueItems?.filter(i => i.status === 'done').length || 0,
    processing: queueItems?.filter(i => i.status === 'processing').length || 0,
    pending: queueItems?.filter(i => i.status === 'pending').length || 0,
    failed: queueItems?.filter(i => i.status === 'failed').length || 0,
    withStory: queueItems?.filter(i => i.music_story_id).length || 0,
    withArtwork: queueItems?.filter(i => {
      const story = musicStories?.find(s => s.id === i.music_story_id);
      return story?.artwork_url;
    }).length || 0,
    withProducts: queueItems?.filter(i => i.product_ids && i.product_ids.length > 0).length || 0,
    fbQueued: queueItems?.filter(i => {
      const fbItem = fbQueue?.find(f => f.music_story_id === i.music_story_id);
      return fbItem?.status === 'pending' || fbItem?.status === 'posted';
    }).length || 0,
    fbPosted: queueItems?.filter(i => {
      const fbItem = fbQueue?.find(f => f.music_story_id === i.music_story_id);
      return fbItem?.status === 'posted';
    }).length || 0,
  };

  if (loadingQueue) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎄 Christmas Import Logs</h1>
        <p className="text-sm text-muted-foreground">
          Artwork wordt automatisch opgehaald via cron job
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.done}</div>
            <div className="text-sm text-muted-foreground">Verwerkt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.processing}</div>
            <div className="text-sm text-muted-foreground">Bezig</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.withStory}</div>
            <div className="text-sm text-muted-foreground">Met Verhaal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.withProducts}</div>
            <div className="text-sm text-muted-foreground">Met Product</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.fbPosted}/{stats.fbQueued}</div>
            <div className="text-sm text-muted-foreground">FB Posted/Queued</div>
          </CardContent>
        </Card>
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Import Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artiest - Titel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">
                  <Music className="h-4 w-4 inline" /> Verhaal
                </TableHead>
                <TableHead className="text-center">
                  <Image className="h-4 w-4 inline" /> Artwork
                </TableHead>
                <TableHead className="text-center">
                  <ShoppingBag className="h-4 w-4 inline" /> Product
                </TableHead>
                <TableHead className="text-center">
                  <Facebook className="h-4 w-4 inline" /> Facebook
                </TableHead>
                <TableHead>Verwerkt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.artist} - {item.song_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'done' ? 'default' :
                      item.status === 'processing' ? 'secondary' :
                      item.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusIcon status={getStoryStatus(item)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusIcon status={getArtworkStatus(item)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusIcon status={getProductStatus(item)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusIcon status={getFacebookStatus(item)} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.processed_at 
                      ? format(new Date(item.processed_at), 'dd MMM HH:mm', { locale: nl })
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
