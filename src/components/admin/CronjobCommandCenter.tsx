import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  FileText,
  Loader2,
  Minus,
  Package,
  Play,
  RefreshCw,
  Search,
  Share2,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { 
  useCronjobCommandCenter, 
  CronjobCategory, 
  ALL_SCHEDULED_CRONJOBS,
  DateRangePreset,
  getDateRangeFromPreset,
} from "@/hooks/useCronjobCommandCenter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const categoryIcons: Record<CronjobCategory, React.ReactNode> = {
  'Content Generatie': <FileText className="h-4 w-4" />,
  'Data Import': <Database className="h-4 w-4" />,
  'Social Media': <Share2 className="h-4 w-4" />,
  'SEO': <Search className="h-4 w-4" />,
  'Products': <Package className="h-4 w-4" />,
  'Community': <Users className="h-4 w-4" />,
};

const categoryColors: Record<CronjobCategory, string> = {
  'Content Generatie': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Data Import': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Social Media': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'SEO': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Products': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Community': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export const CronjobCommandCenter = () => {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const dateRange = getDateRangeFromPreset(datePreset);
  
  const {
    outputStats,
    totalOutput,
    queueStats,
    queueSummary,
    cronjobsWithHealth,
    cronjobsByCategory,
    recentExecutions,
    stats,
    alerts,
    isLoading,
    triggerCronjob,
    comparisonRange,
  } = useCronjobCommandCenter(dateRange);

  const [expandedCategory, setExpandedCategory] = useState<string | null>('Content Generatie');

  const handleTrigger = async (functionName: string) => {
    toast.loading(`${functionName} wordt gestart...`, { id: functionName });
    try {
      await triggerCronjob.mutateAsync(functionName);
      toast.success(`${functionName} succesvol gestart`, { id: functionName });
    } catch (error: any) {
      toast.error(`Fout bij starten ${functionName}`, { 
        id: functionName,
        description: error.message 
      });
    }
  };

  const getStatusIcon = (status: string | null | undefined, isOverdue?: boolean) => {
    if (isOverdue) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPresetLabel = (preset: DateRangePreset) => {
    switch (preset) {
      case 'today': return 'Vandaag';
      case 'yesterday': return 'Gisteren';
      case 'this_week': return 'Deze week';
      case 'last_week': return 'Vorige week';
      default: return 'Aangepast';
    }
  };

  const getComparisonLabel = (preset: DateRangePreset) => {
    switch (preset) {
      case 'today': return 'vs gisteren';
      case 'yesterday': return 'vs eergisteren';
      case 'this_week': return 'vs vorige week';
      case 'last_week': return 'vs 2 weken geleden';
      default: return 'vs vorige periode';
    }
  };

  // Calculate ETA for clearing queue
  const calculateETA = (pending: number, itemsPerHour: number | null) => {
    if (!itemsPerHour || itemsPerHour === 0 || pending === 0) return null;
    const hours = pending / itemsPerHour;
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${Math.round(hours)} uur`;
    return `${Math.round(hours / 24)} dagen`;
  };

  // Prepare chart data for output comparison
  const chartData = outputStats
    .filter(s => s.total_created > 0 || s.previous_created > 0)
    .slice(0, 8)
    .map(s => ({
      name: s.label.length > 12 ? s.label.substring(0, 12) + '...' : s.label,
      'Huidig': s.total_created,
      'Vorig': s.previous_created,
    }));

  const overallHealth = stats.errorJobs > 2 ? 'critical' : 
                        stats.errorJobs > 0 || stats.overdueJobs > 3 ? 'warning' : 'healthy';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DateRangePreset)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecteer periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="yesterday">Gisteren</SelectItem>
                  <SelectItem value="this_week">Deze week</SelectItem>
                  <SelectItem value="last_week">Vorige week</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {format(dateRange.start, 'd MMM', { locale: nl })} - {format(dateRange.end, 'd MMM yyyy', { locale: nl })}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Vergelijk met: {format(comparisonRange.start, 'd MMM', { locale: nl })} - {format(comparisonRange.end, 'd MMM', { locale: nl })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalOutput.created}</p>
                <p className="text-xs text-muted-foreground">Items Aangemaakt</p>
              </div>
              <div className="flex flex-col items-end">
                {totalOutput.previousCreated > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      {totalOutput.created >= totalOutput.previousCreated ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs ${totalOutput.created >= totalOutput.previousCreated ? 'text-green-500' : 'text-destructive'}`}>
                        {Math.abs(totalOutput.created - totalOutput.previousCreated)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">was {totalOutput.previousCreated}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{totalOutput.posted}</span>
            </div>
            <p className="text-xs text-muted-foreground">Gepubliceerd</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{queueSummary.totalPending}</span>
            </div>
            <p className="text-xs text-muted-foreground">In Queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold">{queueSummary.totalFailed}</span>
            </div>
            <p className="text-xs text-muted-foreground">Failed Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Banner */}
      <Card className={
        overallHealth === 'critical' ? 'border-destructive bg-destructive/5' :
        overallHealth === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
        'border-green-500 bg-green-500/5'
      }>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallHealth === 'critical' ? <AlertCircle className="h-5 w-5 text-destructive" /> :
               overallHealth === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
               <CheckCircle className="h-5 w-5 text-green-500" />}
              <div>
                <p className="font-medium text-sm">
                  {overallHealth === 'critical' ? 'Kritieke problemen' :
                   overallHealth === 'warning' ? 'Waarschuwingen aanwezig' :
                   'Alle systemen operationeel'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.healthyJobs}/{stats.totalJobs} jobs gezond
                  {stats.errorJobs > 0 && ` • ${stats.errorJobs} errors`}
                  {queueSummary.totalFailed > 0 && ` • ${queueSummary.totalFailed} queue failures`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{stats.totalJobs} Jobs</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="output" className="space-y-4">
        <TabsList>
          <TabsTrigger value="output">Output Statistieken</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="queues">Queue Health</TabsTrigger>
          <TabsTrigger value="categories">Per Categorie</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-[10px]">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Output Statistics Tab */}
        <TabsContent value="output" className="space-y-4">
          {/* Comparison Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Output Vergelijking</CardTitle>
                <CardDescription>{getPresetLabel(datePreset)} {getComparisonLabel(datePreset)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="Vorig" fill="hsl(var(--muted-foreground))" opacity={0.5} />
                    <Bar dataKey="Huidig" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Output Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {outputStats.map((stat) => (
              <Card key={stat.content_type}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold">{stat.total_created}</span>
                    {stat.trend && getTrendIcon(stat.trend)}
                  </div>
                  <p className="text-xs font-medium truncate">{stat.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] ${stat.diff >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {stat.diff >= 0 ? '+' : ''}{stat.diff} {getComparisonLabel(datePreset)}
                    </span>
                  </div>
                  {stat.total_posted !== stat.total_created && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {stat.total_posted} gepubliceerd
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cronjob Schedules
              </CardTitle>
              <CardDescription>Alle geplande tijdstippen voor automatische taken</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Functie</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Tijdstip</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Output Tabel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ALL_SCHEDULED_CRONJOBS.map((job) => {
                    const jobWithHealth = cronjobsWithHealth.find(j => j.name === job.name);
                    const hasActivity = jobWithHealth?.lastActivityTime;
                    const itemsToday = jobWithHealth?.itemsToday || 0;
                    
                    return (
                      <TableRow key={job.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {jobWithHealth?.hasRecentOutput ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : jobWithHealth?.isOverdue ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : hasActivity ? (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">{job.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{job.schedule}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            🕐 {job.time}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[job.category]}>
                            {job.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.outputTable || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {hasActivity ? (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(jobWithHealth.lastActivityTime!), { addSuffix: true, locale: nl })}
                                </span>
                                {itemsToday > 0 && (
                                  <Badge variant="secondary" className="text-[10px] w-fit">
                                    {itemsToday} vandaag
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Geen output</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Health Tab */}
        <TabsContent value="queues">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Queue Health Overview
              </CardTitle>
              <CardDescription>Real-time status van alle verwerkingsqueues</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Processing</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead>Throughput</TableHead>
                    <TableHead>ETA Leeg</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueStats?.map((queue) => {
                    const eta = calculateETA(queue.pending, queue.items_per_hour);
                    return (
                      <TableRow key={queue.queue_name}>
                        <TableCell className="font-medium">{queue.queue_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={queue.pending > 100 ? 'destructive' : queue.pending > 50 ? 'secondary' : 'outline'}>
                            {queue.pending}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {queue.processing > 0 ? (
                            <Badge className="bg-blue-500/10 text-blue-500">{queue.processing}</Badge>
                          ) : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                        <TableCell className="text-right text-green-500">{queue.completed.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {queue.failed > 0 ? (
                            <Badge variant="destructive">{queue.failed.toLocaleString()}</Badge>
                          ) : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                        <TableCell>
                          {queue.items_per_hour ? (
                            <span className="text-sm">{queue.items_per_hour}/uur</span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {eta ? (
                            <Badge variant="outline" className="font-mono">
                              <Timer className="h-3 w-3 mr-1" />
                              {eta}
                            </Badge>
                          ) : queue.pending === 0 ? (
                            <span className="text-green-500 text-sm">✓ Leeg</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {queue.failed > 100 ? (
                            <Badge variant="destructive">Kritiek</Badge>
                          ) : queue.pending > 500 ? (
                            <Badge className="bg-yellow-500/10 text-yellow-500">Backlog</Badge>
                          ) : queue.processing > 0 ? (
                            <Badge className="bg-blue-500/10 text-blue-500">Actief</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories View */}
        <TabsContent value="categories" className="space-y-4">
          {Object.entries(cronjobsByCategory).map(([category, jobs]) => {
            const categoryJobs = jobs as typeof cronjobsWithHealth;
            const healthy = categoryJobs.filter(j => j.health?.last_status === 'success').length;
            const errors = categoryJobs.filter(j => j.hasError).length;
            const isExpanded = expandedCategory === category;

            return (
              <Collapsible key={category} open={isExpanded} onOpenChange={() => setExpandedCategory(isExpanded ? null : category)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${categoryColors[category as CronjobCategory]}`}>
                            {categoryIcons[category as CronjobCategory]}
                          </div>
                          <div>
                            <CardTitle className="text-base">{category}</CardTitle>
                            <p className="text-xs text-muted-foreground">{categoryJobs.length} jobs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-500">{healthy} ✓</span>
                            {errors > 0 && <span className="text-destructive">{errors} ✗</span>}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Functie</TableHead>
                            <TableHead>Tijdstip</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Laatste Run</TableHead>
                            <TableHead>Success Rate</TableHead>
                            <TableHead className="w-20">Actie</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryJobs.map((job) => {
                            const successRate = job.health 
                              ? Math.round((job.health.successful_runs / Math.max(1, job.health.total_runs)) * 100)
                              : 0;

                            return (
                              <TableRow key={job.name}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(job.health?.last_status, job.isOverdue)}
                                    <div>
                                      <p className="font-medium text-sm">{job.name}</p>
                                      <p className="text-xs text-muted-foreground max-w-xs truncate">{job.description}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {job.time}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {job.isOverdue ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Overdue</Badge>
                                  ) : job.hasError ? (
                                    <Badge variant="destructive">Error</Badge>
                                  ) : job.isRunning ? (
                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Actief</Badge>
                                  ) : job.health ? (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>
                                  ) : (
                                    <Badge variant="outline">Wachtend</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {job.health?.last_run_at ? (
                                    formatDistanceToNow(new Date(job.health.last_run_at), { addSuffix: true, locale: nl })
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {job.health ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={successRate} className="h-1.5 w-12" />
                                      <span className="text-xs">{successRate}%</span>
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTrigger(job.name)}
                                    disabled={triggerCronjob.isPending}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alerts & Waarschuwingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Geen actieve alerts</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          alert.type === 'error' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {alert.type === 'error' ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{alert.job}</p>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                          </div>
                        </div>
                        {alert.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: nl })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
