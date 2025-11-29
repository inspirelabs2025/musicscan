import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Newspaper,
  Music,
  FileText,
  Youtube,
  Radio,
  Database,
  Zap,
  TrendingUp,
  Mail
} from "lucide-react";
import { useStatusDashboard } from "@/hooks/useStatusDashboard";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function StatusDashboard() {
  const [periodHours, setPeriodHours] = useState(8);
  const [sendingReport, setSendingReport] = useState(false);
  
  const {
    processStatus,
    singlesQueue,
    discogsQueue,
    contentStats,
    totalStats,
    newsGenStats,
    newsCache,
    batchQueue,
    cronjobSummary,
    hasIssues,
    isLoading,
    refetch,
  } = useStatusDashboard(periodHours);

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const sendEmailReport = async () => {
    setSendingReport(true);
    try {
      const { error } = await supabase.functions.invoke('daily-status-report');
      if (error) throw error;
      toast.success('Status report email verzonden!');
    } catch (err) {
      toast.error('Kon report niet verzenden');
      console.error(err);
    } finally {
      setSendingReport(false);
    }
  };

  const StatCard = ({ value, label, icon: Icon, color = "primary" }: { value: number; label: string; icon: any; color?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold text-${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
          <Icon className={`w-8 h-8 text-${color}/20`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Status Dashboard</h1>
          <p className="text-muted-foreground">Live overzicht van alle processen en content generatie</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(periodHours)} onValueChange={(v) => setPeriodHours(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Laatste 4 uur</SelectItem>
              <SelectItem value="8">Laatste 8 uur</SelectItem>
              <SelectItem value="12">Laatste 12 uur</SelectItem>
              <SelectItem value="24">Laatste 24 uur</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={sendEmailReport} disabled={sendingReport}>
            <Mail className={`w-4 h-4 mr-2 ${sendingReport ? 'animate-pulse' : ''}`} />
            Stuur Report
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {hasIssues ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <span className="font-semibold">Er zijn problemen gedetecteerd!</span>
            <span className="text-muted-foreground ml-2">Controleer de details hieronder.</span>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <span className="font-semibold">Alles draait soepel!</span>
            <span className="text-muted-foreground ml-2">Alle processen draaien volgens verwachting.</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard value={contentStats?.blogs || 0} label="Nieuwe Blogs" icon={FileText} />
        <StatCard value={contentStats?.musicStories || 0} label="Music Stories" icon={Music} />
        <StatCard value={contentStats?.artistStories || 0} label="Artist Stories" icon={Music} />
        <StatCard value={contentStats?.news || 0} label="Nieuws Artikelen" icon={Newspaper} />
        <StatCard value={contentStats?.anecdotes || 0} label="Anekdotes" icon={Radio} />
        <StatCard value={contentStats?.musicHistory || 0} label="Muziekgeschiedenis" icon={Clock} />
        <StatCard value={contentStats?.youtube || 0} label="YouTube Videos" icon={Youtube} />
        <StatCard value={contentStats?.spotify || 0} label="Spotify Releases" icon={Music} />
        <StatCard value={contentStats?.singles || 0} label="Singles Verwerkt" icon={Music} />
        <StatCard value={contentStats?.discogs || 0} label="Discogs Imports" icon={Database} />
        <StatCard value={contentStats?.indexNow || 0} label="IndexNow" icon={Zap} />
        <StatCard value={cronjobSummary ? Object.values(cronjobSummary).reduce((a, b) => a + b.runs, 0) : 0} label="Cronjob Runs" icon={RefreshCw} />
      </div>

      {/* Database Totals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Totalen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><strong>{totalStats?.totalNews || 0}</strong> Nieuws artikelen</div>
            <div><strong>{totalStats?.totalAnecdotes || 0}</strong> Anekdotes</div>
            <div><strong>{totalStats?.totalMusicHistory || 0}</strong> Muziekgeschiedenis</div>
            <div><strong>{totalStats?.totalYouTube || 0}</strong> YouTube videos</div>
            <div><strong>{totalStats?.totalSpotify || 0}</strong> Spotify releases</div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="processes" className="w-full">
        <TabsList>
          <TabsTrigger value="processes">Proces Status</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="news">Nieuws</TabsTrigger>
          <TabsTrigger value="cronjobs">Alle Cronjobs</TabsTrigger>
        </TabsList>

        {/* Processes Tab */}
        <TabsContent value="processes">
          <Card>
            <CardHeader>
              <CardTitle>Proces Status Overzicht</CardTitle>
              <CardDescription>Verwachte vs. werkelijke uitvoeringen per proces (laatste {periodHours} uur)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Proces</TableHead>
                    <TableHead className="text-center">Runs</TableHead>
                    <TableHead className="text-center">Verwacht</TableHead>
                    <TableHead className="text-center">Succes</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processStatus.map((proc) => (
                    <TableRow key={proc.name} className={proc.status === 'error' ? 'bg-destructive/5' : proc.status === 'warning' ? 'bg-yellow-500/5' : ''}>
                      <TableCell>{getStatusIcon(proc.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{proc.label}</div>
                        <div className="text-xs text-muted-foreground">{proc.name}</div>
                      </TableCell>
                      <TableCell className="text-center">{proc.actualRuns}</TableCell>
                      <TableCell className="text-center">{proc.expectedRuns}</TableCell>
                      <TableCell className="text-center text-green-600">{proc.successful}</TableCell>
                      <TableCell className="text-center text-red-600">{proc.failed}</TableCell>
                      <TableCell className="text-right">{proc.items}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queues Tab */}
        <TabsContent value="queues">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Singles Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Singles Import Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>⏳ Pending</span>
                    <Badge variant="outline">{singlesQueue?.pending || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🔄 Processing</span>
                    <Badge variant="secondary">{singlesQueue?.processing || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>✅ Completed</span>
                    <Badge variant="default" className="bg-green-500">{singlesQueue?.completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>❌ Failed</span>
                    <Badge variant={singlesQueue?.failed ? "destructive" : "outline"}>{singlesQueue?.failed || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discogs Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Discogs Import Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>⏳ Pending</span>
                    <Badge variant="outline">{discogsQueue?.pending || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🔄 Processing</span>
                    <Badge variant="secondary">{discogsQueue?.processing || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>✅ Completed</span>
                    <Badge variant="default" className="bg-green-500">{discogsQueue?.completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>❌ Failed</span>
                    <Badge variant={discogsQueue?.failed ? "destructive" : "outline"}>{discogsQueue?.failed || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Queues */}
            {batchQueue && Object.keys(batchQueue).length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Batch Queues</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Pending</TableHead>
                        <TableHead className="text-center">Processing</TableHead>
                        <TableHead className="text-center">Completed</TableHead>
                        <TableHead className="text-center">Failed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(batchQueue).map(([type, stats]) => (
                        <TableRow key={type}>
                          <TableCell className="font-medium">{type}</TableCell>
                          <TableCell className="text-center">{stats.pending}</TableCell>
                          <TableCell className="text-center">{stats.processing}</TableCell>
                          <TableCell className="text-center text-green-600">{stats.completed}</TableCell>
                          <TableCell className="text-center text-red-600">{stats.failed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <div className="grid md:grid-cols-2 gap-4">
            {/* News Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  Nieuws Generatie
                </CardTitle>
                <CardDescription>Per bron (laatste {periodHours} uur)</CardDescription>
              </CardHeader>
              <CardContent>
                {newsGenStats && newsGenStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bron</TableHead>
                        <TableHead className="text-center">Runs</TableHead>
                        <TableHead className="text-center">Succes</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newsGenStats.map((stat) => (
                        <TableRow key={stat.source} className={stat.lastError ? 'bg-destructive/5' : ''}>
                          <TableCell>
                            <div className="font-medium">{stat.source}</div>
                            {stat.lastError && (
                              <div className="text-xs text-destructive truncate max-w-[200px]">{stat.lastError}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{stat.runs}</TableCell>
                          <TableCell className="text-center text-green-600">{stat.success}</TableCell>
                          <TableCell className="text-right">{stat.items}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">Geen nieuws generatie in deze periode</p>
                )}
              </CardContent>
            </Card>

            {/* News Cache */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  News Cache Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newsCache && newsCache.length > 0 ? (
                  <div className="space-y-3">
                    {newsCache.map((cache) => (
                      <div key={cache.source} className={`flex justify-between items-center p-2 rounded ${cache.isExpired ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                        <div>
                          <div className="font-medium">{cache.source}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(cache.lastCached, { addSuffix: true, locale: nl })}
                          </div>
                        </div>
                        <Badge variant={cache.isExpired ? "outline" : "default"} className={cache.isExpired ? '' : 'bg-green-500'}>
                          {cache.isExpired ? '⚠️ Verlopen' : '✅ Actief'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Geen cache data beschikbaar</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Cronjobs Tab */}
        <TabsContent value="cronjobs">
          <Card>
            <CardHeader>
              <CardTitle>Alle Cronjob Executions</CardTitle>
              <CardDescription>Geaggregeerd per functie (laatste {periodHours} uur)</CardDescription>
            </CardHeader>
            <CardContent>
              {cronjobSummary ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Functie</TableHead>
                      <TableHead className="text-center">Runs</TableHead>
                      <TableHead className="text-center">Succes</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Gem. Tijd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(cronjobSummary)
                      .sort((a, b) => b[1].runs - a[1].runs)
                      .map(([name, stats]) => (
                        <TableRow key={name} className={stats.failed > 0 ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-mono text-sm">{name}</TableCell>
                          <TableCell className="text-center">{stats.runs}</TableCell>
                          <TableCell className="text-center text-green-600">{stats.successful}</TableCell>
                          <TableCell className="text-center text-red-600">{stats.failed}</TableCell>
                          <TableCell className="text-right">{stats.items}</TableCell>
                          <TableCell className="text-right">{stats.avgTime}ms</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Geen cronjob data beschikbaar</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
