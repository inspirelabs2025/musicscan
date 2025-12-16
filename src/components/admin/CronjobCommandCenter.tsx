import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
  Zap,
  Timer,
  TrendingUp,
  FileText,
  Search,
  Share2,
  Package,
  Users,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { useCronjobCommandCenter, CronjobCategory, ALL_SCHEDULED_CRONJOBS } from "@/hooks/useCronjobCommandCenter";

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
  const {
    cronjobsWithHealth,
    cronjobsByCategory,
    queueHealth,
    recentExecutions,
    stats,
    queueStats,
    alerts,
    isLoading,
    triggerCronjob,
  } = useCronjobCommandCenter();

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

  const parseCronSchedule = (cron: string) => {
    const parts = cron.split(' ');
    if (parts[0] === '*' && parts[1] === '*') return 'Elke minuut';
    if (parts[0].startsWith('*/')) return `Elke ${parts[0].replace('*/', '')} min`;
    if (parts[1].startsWith('*/')) return `Elke ${parts[1].replace('*/', '')} uur`;
    if (parts[1].includes('-')) return `${parts[1]} UTC (elk uur)`;
    if (parts[1].includes(',')) return `${parts[1].split(',').length}x per dag`;
    if (parts[0] !== '*' && parts[1] !== '*') return `${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')} UTC`;
    return cron;
  };

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
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalJobs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Totaal Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.activeJobs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Actief Nu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.healthyJobs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Gezond</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold">{stats.errorJobs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.overdueJobs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{queueStats.totalPending}</span>
            </div>
            <p className="text-xs text-muted-foreground">Queue Backlog</p>
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
                  {stats.errorJobs > 0 && `${stats.errorJobs} errors`}
                  {stats.errorJobs > 0 && stats.overdueJobs > 0 && ' • '}
                  {stats.overdueJobs > 0 && `${stats.overdueJobs} overdue`}
                  {queueStats.totalFailed > 0 && ` • ${queueStats.totalFailed} failed queue items`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Per Categorie</TabsTrigger>
          <TabsTrigger value="queues">Queue Health</TabsTrigger>
          <TabsTrigger value="timeline">Activiteit</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-[10px]">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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
                            <TableHead>Function</TableHead>
                            <TableHead>Schedule</TableHead>
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
                                    {parseCronSchedule(job.schedule)}
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

        {/* Queue Health */}
        <TabsContent value="queues">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Queue Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Processing</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Laatste Activiteit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueHealth?.map((queue) => (
                    <TableRow key={queue.queue_name}>
                      <TableCell className="font-medium">{queue.queue_name}</TableCell>
                      <TableCell>
                        <Badge variant={queue.pending > 100 ? 'destructive' : queue.pending > 50 ? 'secondary' : 'outline'}>
                          {queue.pending}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {queue.processing > 0 ? (
                          <Badge className="bg-blue-500/10 text-blue-500">{queue.processing}</Badge>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-green-500">{queue.completed}</TableCell>
                      <TableCell>
                        {queue.failed > 0 ? (
                          <Badge variant="destructive">{queue.failed}</Badge>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {queue.last_activity ? formatDistanceToNow(new Date(queue.last_activity), { addSuffix: true, locale: nl }) : '-'}
                      </TableCell>
                      <TableCell>
                        {queue.failed > 10 ? (
                          <Badge variant="destructive">Kritiek</Badge>
                        ) : queue.pending > 100 ? (
                          <Badge className="bg-yellow-500/10 text-yellow-500">Backlog</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-500">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Recente Activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentExecutions?.map((exec) => (
                    <div 
                      key={exec.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(exec.status)}
                        <div>
                          <p className="font-medium text-sm">{exec.function_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(exec.started_at), 'dd MMM HH:mm:ss', { locale: nl })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {exec.execution_time_ms && (
                          <span className="text-muted-foreground font-mono">
                            {exec.execution_time_ms > 1000 
                              ? `${(exec.execution_time_ms / 1000).toFixed(1)}s`
                              : `${exec.execution_time_ms}ms`}
                          </span>
                        )}
                        {exec.items_processed !== null && exec.items_processed > 0 && (
                          <Badge variant="secondary">{exec.items_processed} items</Badge>
                        )}
                        {exec.error_message && (
                          <span className="text-xs text-destructive max-w-xs truncate">{exec.error_message}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!recentExecutions || recentExecutions.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Geen recente activiteit</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alerts & Waarschuwingen ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Geen actieve alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        alert.type === 'error' ? 'bg-destructive/5 border-destructive/20' : 'bg-yellow-500/5 border-yellow-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {alert.type === 'error' ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{alert.job}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: nl })}
                          </span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleTrigger(alert.job)}>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
