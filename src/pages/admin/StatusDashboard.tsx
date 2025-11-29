import { useStatusDashboard, ContentActivity } from "@/hooks/useStatusDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, HelpCircle, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IndexNowChart } from "@/components/admin/IndexNowChart";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ok: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    unknown: 'bg-muted text-muted-foreground border-muted',
  };
  
  const labels: Record<string, string> = {
    ok: 'OK',
    warning: 'Waarschuwing',
    error: 'Probleem',
    unknown: 'Onbekend',
  };
  
  return (
    <Badge variant="outline" className={variants[status] || variants.unknown}>
      {labels[status] || 'Onbekend'}
    </Badge>
  );
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Nooit';
  return formatDistanceToNow(date, { addSuffix: true, locale: nl });
}

function IssuesSection({ issues }: { issues: ContentActivity[] }) {
  if (issues.length === 0) return null;
  
  const errors = issues.filter(i => i.status === 'error');
  const warnings = issues.filter(i => i.status === 'warning');
  
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Aandachtspunten ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {errors.map(issue => (
          <div key={issue.source.id} className="flex items-center gap-3 p-2 rounded bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <span className="font-medium">{issue.source.icon} {issue.source.label}</span>
              <span className="text-muted-foreground text-sm ml-2">
                — Laatste activiteit: {formatRelativeTime(issue.lastActivity)}
                {issue.hoursSinceActivity && ` (${Math.round(issue.hoursSinceActivity)} uur geleden)`}
              </span>
            </div>
          </div>
        ))}
        {warnings.map(issue => (
          <div key={issue.source.id} className="flex items-center gap-3 p-2 rounded bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <span className="font-medium">{issue.source.icon} {issue.source.label}</span>
              <span className="text-muted-foreground text-sm ml-2">
                — Verwacht: {issue.source.expectedDaily}/dag, gevonden: {issue.countInPeriod} in 24u
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OverallStatus({ errorCount, warningCount }: { errorCount: number; warningCount: number }) {
  if (errorCount > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <XCircle className="h-8 w-8 text-red-500" />
        <div>
          <div className="font-semibold text-lg">Problemen Gedetecteerd</div>
          <div className="text-sm text-muted-foreground">
            {errorCount} kritiek, {warningCount} waarschuwingen
          </div>
        </div>
      </div>
    );
  }
  
  if (warningCount > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <div>
          <div className="font-semibold text-lg">Waarschuwingen</div>
          <div className="text-sm text-muted-foreground">
            {warningCount} items vereisen aandacht
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle2 className="h-8 w-8 text-green-500" />
      <div>
        <div className="font-semibold text-lg">Alles Operationeel</div>
        <div className="text-sm text-muted-foreground">
          Alle content generatie processen werken correct
        </div>
      </div>
    </div>
  );
}

export default function StatusDashboard() {
  const [sendingReport, setSendingReport] = useState(false);
  const { 
    contentActivity, 
    queueStats, 
    cronLogs,
    issues,
    errorCount,
    warningCount,
    isLoading, 
    refetch 
  } = useStatusDashboard(24);

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Status Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overzicht van content generatie (laatste 24 uur)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Button onClick={sendEmailReport} disabled={sendingReport} size="sm">
            <Mail className={`h-4 w-4 mr-2 ${sendingReport ? 'animate-pulse' : ''}`} />
            Stuur Report
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <OverallStatus errorCount={errorCount} warningCount={warningCount} />

      {/* Issues Section */}
      <IssuesSection issues={issues} />

      {/* IndexNow Chart */}
      <IndexNowChart />

      {/* Content Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Generatie Overzicht</CardTitle>
          <CardDescription>
            Status gebaseerd op daadwerkelijke content in de database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Type</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Laatste Activiteit</TableHead>
                <TableHead className="text-right">Laatste 24u</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentActivity.map((activity) => (
                <TableRow key={activity.source.id}>
                  <TableCell className="font-medium">
                    <span className="mr-2">{activity.source.icon}</span>
                    {activity.source.label}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {activity.source.schedule}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={activity.hoursSinceActivity && activity.hoursSinceActivity > activity.source.warningAfterHours ? 'text-destructive' : ''}>
                        {formatRelativeTime(activity.lastActivity)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {activity.countInPeriod}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {activity.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StatusIcon status={activity.status} />
                      <StatusBadge status={activity.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Queue Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
          <CardDescription>
            Overzicht van verwerkingsqueues
          </CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueStats.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell className="font-medium">{queue.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                      {queue.pending.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                      {queue.processing.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      {queue.completed.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <Badge variant="outline" className={queue.failed > 0 ? "bg-red-500/10 text-red-500" : ""}>
                      {queue.failed.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Cron Logs (for reference) */}
      {cronLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente Cron Job Logs</CardTitle>
            <CardDescription>
              Laatste {cronLogs.length} gelogde uitvoeringen (niet alle jobs loggen)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Functie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gestart</TableHead>
                  <TableHead className="text-right">Duur</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.function_name}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatRelativeTime(new Date(log.started_at))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {log.execution_time_ms ? `${(log.execution_time_ms / 1000).toFixed(1)}s` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {log.items_processed || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
