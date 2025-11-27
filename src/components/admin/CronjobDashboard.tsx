import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  CheckCircle,
  ChevronDown,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
  Zap,
  Timer,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { useCronjobExecutionLog, SCHEDULED_CRONJOBS } from "@/hooks/useCronjobExecutionLog";

export const CronjobDashboard = () => {
  const { cronjobsWithStats, executions, isLoading, triggerCronjob } = useCronjobExecutionLog();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

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

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="bg-muted">Nooit gedraaid</Badge>;
    }
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Succes</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Actief</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) {
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const parseCronSchedule = (cron: string) => {
    const parts = cron.split(' ');
    if (parts[0].startsWith('*/')) {
      const minutes = parts[0].replace('*/', '');
      return `Elke ${minutes} min`;
    }
    if (parts[1].startsWith('*/')) {
      const hours = parts[1].replace('*/', '');
      return `Elke ${hours} uur`;
    }
    if (parts[1].includes(',')) {
      return `${parts[1].split(',').length}x per dag`;
    }
    if (parts[0] !== '*' && parts[1] !== '*') {
      return `Dagelijks ${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')} UTC`;
    }
    return cron;
  };

  // Calculate overview stats
  const totalJobs = SCHEDULED_CRONJOBS.length;
  const activeJobs = cronjobsWithStats.filter(j => j.stats?.running_count && j.stats.running_count > 0).length;
  const errorJobs = cronjobsWithStats.filter(j => j.stats?.last_status === 'error').length;
  const healthyJobs = cronjobsWithStats.filter(j => j.stats?.last_status === 'success').length;
  const neverRanJobs = cronjobsWithStats.filter(j => !j.stats).length;

  const overallHealth = errorJobs > 2 ? 'critical' : errorJobs > 0 ? 'warning' : 'healthy';

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalJobs}</div>
                <div className="text-xs text-muted-foreground">Totaal</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeJobs}</div>
                <div className="text-xs text-muted-foreground">Actief</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{healthyJobs}</div>
                <div className="text-xs text-muted-foreground">Gezond</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{errorJobs}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{neverRanJobs}</div>
                <div className="text-xs text-muted-foreground">Wachtend</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Banner */}
      <Card className={
        overallHealth === 'critical' ? 'border-destructive bg-destructive/5' :
        overallHealth === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
        'border-green-500 bg-green-500/5'
      }>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallHealth === 'critical' ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : overallHealth === 'warning' ? (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
              <div>
                <div className="font-semibold">
                  {overallHealth === 'critical' ? 'Kritieke problemen gedetecteerd' :
                   overallHealth === 'warning' ? 'Waarschuwingen aanwezig' :
                   'Alle cronjobs functioneren normaal'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {errorJobs > 0 ? `${errorJobs} job(s) met errors` : 'Geen errors'}
                </div>
              </div>
            </div>
            <Badge variant={overallHealth === 'healthy' ? 'default' : 'destructive'}>
              {overallHealth === 'healthy' ? 'Gezond' : 
               overallHealth === 'warning' ? 'Waarschuwing' : 'Kritiek'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cronjobs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Alle Scheduled Functions ({SCHEDULED_CRONJOBS.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Laatste Run</TableHead>
                  <TableHead>Duur (gem)</TableHead>
                  <TableHead>Succes Rate</TableHead>
                  <TableHead className="w-[100px]">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronjobsWithStats.map((job) => {
                  const successRate = job.stats 
                    ? Math.round((job.stats.successful_runs / Math.max(1, job.stats.total_runs)) * 100)
                    : 0;
                  const isExpanded = expandedJob === job.name;
                  const jobExecutions = executions?.filter(e => e.function_name === job.name).slice(0, 5) || [];

                  return (
                    <Collapsible key={job.name} open={isExpanded} onOpenChange={() => setExpandedJob(isExpanded ? null : job.name)}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.stats?.last_status)}
                            <div>
                              <div className="font-medium">{job.name}</div>
                              <div className="text-xs text-muted-foreground">{job.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {parseCronSchedule(job.schedule)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.stats?.last_status)}
                        </TableCell>
                        <TableCell>
                          {job.stats?.last_run_at ? (
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(job.stats.last_run_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.stats?.avg_execution_time_ms ? (
                            <span className="text-sm font-mono">
                              {job.stats.avg_execution_time_ms > 1000 
                                ? `${(job.stats.avg_execution_time_ms / 1000).toFixed(1)}s`
                                : `${job.stats.avg_execution_time_ms}ms`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.stats ? (
                            <div className="flex items-center gap-2">
                              <Progress value={successRate} className="h-2 w-16" />
                              <span className="text-sm font-medium">{successRate}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrigger(job.name);
                            }}
                            disabled={triggerCronjob.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={8} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Recente Executions</h4>
                                {job.stats && (
                                  <div className="flex gap-4 text-sm text-muted-foreground">
                                    <span>Totaal: {job.stats.total_runs}</span>
                                    <span className="text-green-500">Succes: {job.stats.successful_runs}</span>
                                    <span className="text-destructive">Failed: {job.stats.failed_runs}</span>
                                  </div>
                                )}
                              </div>
                              {jobExecutions.length > 0 ? (
                                <div className="space-y-2">
                                  {jobExecutions.map((exec) => (
                                    <div 
                                      key={exec.id} 
                                      className="flex items-center justify-between p-2 rounded-lg bg-background border"
                                    >
                                      <div className="flex items-center gap-3">
                                        {getStatusIcon(exec.status)}
                                        <span className="text-sm">
                                          {format(new Date(exec.started_at), 'dd MMM HH:mm:ss', { locale: nl })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {exec.execution_time_ms && (
                                          <span className="text-sm text-muted-foreground">
                                            {exec.execution_time_ms > 1000 
                                              ? `${(exec.execution_time_ms / 1000).toFixed(1)}s`
                                              : `${exec.execution_time_ms}ms`}
                                          </span>
                                        )}
                                        {exec.items_processed !== null && (
                                          <Badge variant="secondary">{exec.items_processed} items</Badge>
                                        )}
                                        {exec.error_message && (
                                          <span className="text-xs text-destructive max-w-xs truncate">
                                            {exec.error_message}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  Nog geen executions gelogd
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recente Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {executions?.slice(0, 10).map((exec) => (
              <div 
                key={exec.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(exec.status)}
                  <div>
                    <div className="font-medium">{exec.function_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true, locale: nl })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exec.items_processed !== null && exec.items_processed > 0 && (
                    <Badge variant="secondary">{exec.items_processed} items</Badge>
                  )}
                  {exec.execution_time_ms && (
                    <span className="text-sm text-muted-foreground font-mono">
                      {exec.execution_time_ms > 1000 
                        ? `${(exec.execution_time_ms / 1000).toFixed(1)}s`
                        : `${exec.execution_time_ms}ms`}
                    </span>
                  )}
                  {getStatusBadge(exec.status)}
                </div>
              </div>
            ))}
            {(!executions || executions.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen cronjob executions gelogd. Executions worden automatisch gelogd wanneer cronjobs draaien.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
