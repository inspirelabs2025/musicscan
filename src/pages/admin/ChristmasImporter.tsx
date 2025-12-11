import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, Play, Pause, RefreshCw, CheckCircle2, XCircle, Clock, 
  Upload, Music, Trash2, RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface QueueItem {
  id: string;
  artist: string;
  song_title: string;
  album: string | null;
  year: number | null;
  status: string;
  attempts: number;
  error_message: string | null;
  music_story_id: string | null;
  created_at: string;
  processed_at: string | null;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export default function ChristmasImporter() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({ pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from('christmas_import_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching queue:', error);
      return;
    }

    setQueue(data || []);

    // Calculate stats
    const newStats = (data || []).reduce((acc, item) => {
      acc[item.status as keyof QueueStats] = (acc[item.status as keyof QueueStats] || 0) + 1;
      acc.total++;
      return acc;
    }, { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });

    setStats(newStats);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const processNext = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('christmas-batch-processor');
      
      if (error) throw error;
      
      toast({
        title: data.success ? "✅ Verwerkt" : "❌ Fout",
        description: data.message || `${data.processed?.artist} - ${data.processed?.song_title}`,
      });
      
      fetchQueue();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importBulk = async () => {
    if (!bulkInput.trim()) {
      toast({ title: "Geen data", description: "Voer songs in om te importeren", variant: "destructive" });
      return;
    }

    try {
      // Parse input - expect format: "Artist - Song Title" per line
      // Support multiple separators: " - ", " – ", " — "
      const lines = bulkInput.trim().split('\n').filter(l => l.trim());
      const songs = lines.map(line => {
        // Normalize different dash types to standard hyphen
        const normalizedLine = line.replace(/\s*[–—]\s*/g, ' - ');
        const [artist, ...titleParts] = normalizedLine.split(' - ');
        return {
          artist: artist?.trim(),
          song_title: titleParts.join(' - ').trim(),
        };
      }).filter(s => s.artist && s.song_title);

      if (songs.length === 0) {
        toast({ title: "Ongeldige input", description: "Gebruik format: Artist - Song Title", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('import-christmas-batch', {
        body: { songs }
      });

      if (error) throw error;

      toast({
        title: "🎄 Geïmporteerd",
        description: `${data.imported} songs toegevoegd, ${data.skipped} overgeslagen`,
      });

      setBulkInput('');
      fetchQueue();
    } catch (error: any) {
      toast({
        title: "Import fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const retryFailed = async (id: string) => {
    const { error } = await supabase
      .from('christmas_import_queue')
      .update({ status: 'pending', attempts: 0, error_message: null })
      .eq('id', id);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Opnieuw in queue" });
      fetchQueue();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('christmas_import_queue')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🗑️ Verwijderd" });
      fetchQueue();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Wachtend</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Bezig</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Klaar</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" />Mislukt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold">🎄 Kerst Content Importer</h1>
            <p className="text-muted-foreground">Importeer en verwerk kerstliedjes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchQueue} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Vernieuwen
          </Button>
          <Button 
            onClick={processNext} 
            disabled={isProcessing || stats.pending === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Bezig...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Verwerk Volgende</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Wachtend</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
            <div className="text-sm text-muted-foreground">Bezig</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Klaar</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Mislukt</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Queue ({stats.total})</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Geen items in queue. Importeer kerstliedjes om te beginnen!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <Card key={item.id} className="hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.artist} - {item.song_title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          {item.album && <span>{item.album}</span>}
                          {item.year && <span>({item.year})</span>}
                          <span>•</span>
                          <span>{format(new Date(item.created_at), 'dd MMM HH:mm', { locale: nl })}</span>
                          {item.attempts > 0 && <span>• Pogingen: {item.attempts}</span>}
                        </div>
                        {item.error_message && (
                          <div className="text-xs text-red-500 mt-1">{item.error_message}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {item.status === 'failed' && (
                          <Button size="sm" variant="ghost" onClick={() => retryFailed(item.id)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {item.status === 'completed' && item.music_story_id && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`/singles/${item.artist.toLowerCase().replace(/\s+/g, '-')}-${item.song_title.toLowerCase().replace(/\s+/g, '-')}`} target="_blank">
                              Bekijk
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Import
              </CardTitle>
              <CardDescription>
                Voer kerstliedjes in, één per regel in format: <code>Artist - Song Title</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={`Wham! - Last Christmas\nMariah Carey - All I Want for Christmas Is You\nBing Crosby - White Christmas\nPogues - Fairytale of New York`}
                rows={10}
                className="font-mono text-sm"
              />
              <Button onClick={importBulk} className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Importeer Songs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎵 Kerst Klassiekers Preset</CardTitle>
              <CardDescription>Klik om populaire kerstsongs toe te voegen</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => setBulkInput(`Wham! - Last Christmas
Mariah Carey - All I Want for Christmas Is You
Bing Crosby - White Christmas
The Pogues feat. Kirsty MacColl - Fairytale of New York
Chris Rea - Driving Home for Christmas
Band Aid - Do They Know It's Christmas
Wizzard - I Wish It Could Be Christmas Everyday
Shakin' Stevens - Merry Christmas Everyone
Slade - Merry Xmas Everybody
John Lennon - Happy Xmas (War Is Over)
Michael Bublé - It's Beginning to Look a Lot Like Christmas
Brenda Lee - Rockin' Around the Christmas Tree
Bobby Helms - Jingle Bell Rock
Andy Williams - It's the Most Wonderful Time of the Year
Nat King Cole - The Christmas Song`)}
              >
                📋 Laad Top 15 Kerst Klassiekers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
