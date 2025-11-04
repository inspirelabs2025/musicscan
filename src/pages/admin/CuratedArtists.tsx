import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, Music, RefreshCw } from "lucide-react";

interface CuratedArtist {
  id: string;
  artist_name: string;
  is_active: boolean;
  priority: number;
  releases_found_count: number;
  last_crawled_at: string | null;
}

const CuratedArtists = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newArtistName, setNewArtistName] = useState("");
  const [isTriggeringCrawl, setIsTriggeringCrawl] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [autoSeeded, setAutoSeeded] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [showCronSql, setShowCronSql] = useState(false);
  const { data: artists, isLoading } = useQuery({
    queryKey: ['curated-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curated_artists')
        .select('*')
        .order('priority', { ascending: false })
        .order('artist_name', { ascending: true });

      if (error) throw error;
      return data as CuratedArtist[];
    },
  });

  const addArtistMutation = useMutation({
    mutationFn: async (artistName: string) => {
      const { error } = await supabase
        .from('curated_artists')
        .insert({ artist_name: artistName, is_active: true, priority: 1 });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
      setNewArtistName("");
      toast({
        title: "✅ Artiest Toegevoegd",
        description: "De artiest is toegevoegd aan de lijst",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('curated_artists')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('curated_artists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
      toast({
        title: "🗑️ Artiest Verwijderd",
      });
    },
  });

  const triggerCrawler = async () => {
    setIsTriggeringCrawl(true);
    try {
      const { data, error } = await supabase.functions.invoke('discogs-lp-crawler');
      
      if (error) throw error;
      
      toast({
        title: "🎵 Crawler Gestart",
        description: `${data.releases_found} releases gevonden, ${data.queued} toegevoegd aan wachtrij`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
    } catch (error: any) {
      toast({
        title: "❌ Crawler Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTriggeringCrawl(false);
    }
  };

  const processQueueNow = async () => {
    setIsProcessingQueue(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-discogs-queue');
      if (error) throw error;
      toast({
        title: '⚙️ Wachtrij Verwerkt',
        description: typeof data === 'object' ? JSON.stringify(data) : String(data),
      });
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
    } catch (error: any) {
      toast({ title: '❌ Wachtrij Fout', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const runCrawlerAndQueue = async () => {
    setIsRunningAll(true);
    try {
      await triggerCrawler();
      await processQueueNow();
      toast({ title: '✅ Crawler + Wachtrij gestart' });
    } catch (error: any) {
      toast({ title: '❌ Fout bij uitvoeren', description: error.message, variant: 'destructive' });
    } finally {
      setIsRunningAll(false);
    }
  };

  const seedArtists = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-curated-artists');
      if (error) throw error;
      toast({
        title: "✅ Artiesten Toegevoegd",
        description: `${data?.inserted || 0} nieuw, totaal ${data?.total || ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['curated-artists'] });
    } catch (error: any) {
      toast({
        title: "❌ Seed Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };
  const activeCount = artists?.filter(a => a.is_active).length || 0;
  const totalCount = artists?.length || 0;

  // Auto-seed once if fewer than 200 artists exist
  // This will only run once per mount to prevent loops
  // and immediately populate the dashboard for convenience
  // (safe: insert ignores duplicates)
  useEffect(() => {
    if (!isLoading && !autoSeeded && (totalCount < 200)) {
      setAutoSeeded(true);
      seedArtists();
    }
  }, [isLoading, autoSeeded, totalCount]);

  const cronSQL = `-- Safe unschedule (ignore if job doesn't exist)
DO $$ BEGIN PERFORM cron.unschedule('hourly-discogs-lp-crawler'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('process-discogs-queue'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule: Discogs LP Crawler (hourly)
SELECT cron.schedule(
  'hourly-discogs-lp-crawler',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-lp-crawler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb
  );
  $$
);

-- Schedule: Process Discogs Queue (every 2 minutes)
SELECT cron.schedule(
  'process-discogs-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/process-discogs-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb
  );
  $$
);

-- Verify
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            Gecureerde Artiesten voor LP Crawler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Totaal Artiesten</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                <div className="text-sm text-muted-foreground">Actieve Artiesten</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button 
                  onClick={triggerCrawler} 
                  disabled={isTriggeringCrawl}
                  className="w-full"
                >
                  {isTriggeringCrawl ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Handmatig Crawlen
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={processQueueNow}
                  disabled={isProcessingQueue}
                  className="w-full"
                >
                  {isProcessingQueue ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Wachtrij verwerken...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verwerk Wachtrij Nu
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={runCrawlerAndQueue}
                  disabled={isRunningAll || isTriggeringCrawl || isProcessingQueue}
                  className="w-full"
                >
                  {isRunningAll ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Crawler + Wachtrij...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Crawler + Wachtrij
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Artiestnaam toevoegen..."
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newArtistName.trim()) {
                  addArtistMutation.mutate(newArtistName.trim());
                }
              }}
            />
            <Button
              onClick={() => newArtistName.trim() && addArtistMutation.mutate(newArtistName.trim())}
              disabled={!newArtistName.trim() || addArtistMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Toevoegen
            </Button>
            <Button
              variant="secondary"
              onClick={seedArtists}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Seeden...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Seed 200 Artiesten
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCronSql(true)}
            >
              Cronjobs Activeren (SQL)
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artiest</TableHead>
                  <TableHead>Actief</TableHead>
                  <TableHead>Releases Gevonden</TableHead>
                  <TableHead>Laatst Gecrawld</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : artists?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nog geen artiesten toegevoegd
                    </TableCell>
                  </TableRow>
                ) : (
                  artists?.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell className="font-medium">{artist.artist_name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={artist.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: artist.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>{artist.releases_found_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {artist.last_crawled_at
                          ? new Date(artist.last_crawled_at).toLocaleString('nl-NL')
                          : 'Nog nooit'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArtistMutation.mutate(artist.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuratedArtists;
