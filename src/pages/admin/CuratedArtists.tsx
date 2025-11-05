import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DiscogsQueueMonitor } from "@/components/admin/DiscogsQueueMonitor";
import { Separator } from "@/components/ui/separator";
import { useImportLogByArtist, ImportLogItem } from "@/hooks/useImportLogByArtist";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, RefreshCw, ChevronDown, ChevronRight, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Music, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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

  const { data: queueCount } = useQuery({
    queryKey: ['discogs-queue-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('discogs_import_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
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
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Curated Artists</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{queueCount || 0}</div>
                <div className="text-sm text-muted-foreground">In Wachtrij</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
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
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
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
                <Button
                  variant="outline"
                  onClick={() => setShowCronSql(true)}
                  className="w-full"
                >
                  Cronjobs Activeren (SQL)
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

      <Separator className="my-8" />

      <DiscogsQueueMonitor />

      <Dialog open={showCronSql} onOpenChange={setShowCronSql}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cronjobs Activeren</DialogTitle>
            <DialogDescription>
              Voer deze SQL uit in de Supabase SQL Editor om de automatische crawler te starten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              {cronSQL}
            </pre>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(cronSQL);
                toast({ title: "📋 SQL Gekopieerd" });
              }}
              className="w-full"
            >
              Kopieer SQL
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/sql', '_blank')}
              className="w-full"
            >
              Open Supabase SQL Editor →
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ArtistRowProps {
  artist: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const ArtistRow = ({ artist, isExpanded, onToggleExpand, onDelete, isDeleting }: ArtistRowProps) => {
  const { data: importLogItems, isLoading } = useImportLogByArtist(isExpanded ? artist.artist_name : null);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <h3 className="font-semibold">{artist.artist_name}</h3>
              <Badge variant={artist.is_active ? "default" : "secondary"}>
                {artist.is_active ? "Actief" : "Inactief"}
              </Badge>
              <Badge variant="outline">Prioriteit: {artist.priority}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1 ml-6">
              {artist.releases_found_count} releases gevonden
              {artist.last_crawled_at && (
                <> • Laatste crawl: {new Date(artist.last_crawled_at).toLocaleDateString('nl-NL')}</>
              )}
            </div>
            {artist.notes && (
              <div className="text-sm text-muted-foreground mt-1 ml-6 italic">
                {artist.notes}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="border-t p-4 bg-muted/50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !importLogItems || importLogItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Geen releases gevonden in import log
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-2">
                  Import Log Items ({importLogItems.length})
                </div>
                {importLogItems.map((item) => (
                  <ImportLogItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

interface ImportLogItemCardProps {
  item: ImportLogItem;
}

const ImportLogItemCard = ({ item }: ImportLogItemCardProps) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="p-3 border rounded bg-background">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <span className="font-mono text-xs text-muted-foreground">
              {item.discogs_release_id}
            </span>
            <a
              href={`https://www.discogs.com/release/${item.discogs_release_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="font-medium">{item.title}</div>
          {item.year && (
            <div className="text-sm text-muted-foreground">
              {item.year} • {item.label || 'Geen label'} • {item.catalog_number || 'Geen cat#'}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {item.product_id && (
            <a
              href={`/product/${item.product_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="default" className="cursor-pointer">
                Product
              </Badge>
            </a>
          )}
          {item.blog_id && (
            <Badge variant="secondary">Blog</Badge>
          )}
          <Badge variant="outline">{item.status}</Badge>
        </div>
      </div>
      {item.error_message && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950 p-2 rounded">
          {item.error_message}
        </div>
      )}
      {item.retry_count > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          Retry: {item.retry_count}
        </div>
      )}
    </div>
  );
};

export default CuratedArtists;
