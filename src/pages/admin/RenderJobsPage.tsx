import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, RotateCcw, ChevronLeft, ChevronRight, Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RenderJob {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'poison';
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface Stats {
  pending: number;
  running: number;
  done: number;
  error: number;
  poison?: number;
  total: number;
}

interface WorkerStats {
  id: string;
  last_heartbeat: string;
  polling_interval_ms: number;
  status: string;
}

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  done: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  poison: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const getWorkerStatus = (lastHeartbeat: string | null): { label: string; color: string } => {
  if (!lastHeartbeat) return { label: 'Offline', color: 'bg-gray-500' };
  const diff = Date.now() - new Date(lastHeartbeat).getTime();
  if (diff < 60000) return { label: 'Active', color: 'bg-green-500' };
  if (diff < 300000) return { label: 'Idle', color: 'bg-yellow-500' };
  return { label: 'Offline', color: 'bg-red-500' };
};

export default function RenderJobsPage() {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [requeueingId, setRequeuingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetchWorkerStats = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/list_render_jobs?worker_stats=true`
      );
      const data = await response.json();
      if (data.ok && data.worker_stats) {
        setWorkerStats(data.worker_stats);
      }
    } catch (error) {
      console.error('Error fetching worker stats:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/list_render_jobs?${params}`
      );
      const data = await response.json();

      if (data.ok) {
        setJobs(data.jobs || []);
        setStats(data.stats);
        setHasMore(data.pagination?.hasMore || false);
        setTotal(data.pagination?.total || 0);
      } else {
        toast.error('Fout bij ophalen jobs: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Kon jobs niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchWorkerStats();
  }, [statusFilter, offset]);

  const handleRetryFailed = async () => {
    const adminKey = prompt('Voer ADMIN_SECRET in:');
    if (!adminKey) return;

    setRetrying(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/retry_failed_jobs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ADMIN-KEY': adminKey,
          },
        }
      );
      const data = await response.json();

      if (data.ok) {
        toast.success(data.message);
        fetchJobs();
      } else {
        toast.error('Fout: ' + data.error);
      }
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
      toast.error('Kon jobs niet herstarten');
    } finally {
      setRetrying(false);
    }
  };

  const handleRequeue = async (job: RenderJob) => {
    const adminKey = prompt('Voer ADMIN_SECRET in:');
    if (!adminKey) return;

    setRequeuingId(job.id);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/enqueue_render_job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ADMIN-KEY': adminKey,
          },
          body: JSON.stringify({
            type: job.type,
            payload: job.payload,
            priority: job.priority,
          }),
        }
      );
      const data = await response.json();

      if (data.ok) {
        toast.success(`Job opnieuw in wachtrij gezet: ${data.id}`);
        fetchJobs();
      } else {
        toast.error('Fout: ' + data.error);
      }
    } catch (error) {
      console.error('Error requeuing job:', error);
      toast.error('Kon job niet opnieuw toevoegen');
    } finally {
      setRequeuingId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Render Jobs</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleRetryFailed}
            disabled={retrying || !stats?.error}
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Retry Failed ({stats?.error || 0})
          </Button>
        </div>
      </div>

      {/* Worker Status Card */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workerStats ? (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getWorkerStatus(workerStats.last_heartbeat).color} animate-pulse`} />
                <span className="font-medium">{getWorkerStatus(workerStats.last_heartbeat).label}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">ID:</span> {workerStats.id}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Last heartbeat:</span>{' '}
                {formatDistanceToNow(new Date(workerStats.last_heartbeat), { addSuffix: true, locale: nl })}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Polling:</span> {workerStats.polling_interval_ms}ms
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Geen worker actief</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Totaal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-400">Running</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{stats.running}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-400">Done</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{stats.done}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-400">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">{stats.error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter op status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Toont {offset + 1}-{Math.min(offset + limit, total)} van {total}
        </span>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Geen jobs gevonden
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[job.status]}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>{job.attempts}/{job.max_attempts}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(job.created_at), 'dd MMM HH:mm', { locale: nl })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(job.updated_at), 'dd MMM HH:mm', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequeue(job)}
                        disabled={requeueingId === job.id}
                      >
                        {requeueingId === job.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Requeue'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Vorige
        </Button>
        <Button
          variant="outline"
          onClick={() => setOffset(offset + limit)}
          disabled={!hasMore}
        >
          Volgende
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
