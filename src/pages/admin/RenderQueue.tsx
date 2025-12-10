import { useState, useEffect } from 'react';
import { useRenderQueue, RenderJob } from '@/hooks/useRenderQueue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Trash2, Play, Eye, Plus, Clock, CheckCircle, XCircle, Loader2, Copy, Code, Pause, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateWorkerExampleCode } from '@/lib/workerClient';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  running: 'bg-blue-500',
  processing: 'bg-blue-500',
  done: 'bg-green-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
  failed: 'bg-red-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  running: <Loader2 className="h-4 w-4 animate-spin" />,
  processing: <Loader2 className="h-4 w-4 animate-spin" />,
  done: <CheckCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
};

function JobDetailsDialog({ job }: { job: RenderJob }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
          <DialogDescription>ID: {job.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Type:</strong> {job.type || job.source_type || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <Badge className={statusColors[job.status]}>{job.status}</Badge>
            </div>
            <div>
              <strong>Priority:</strong> {job.priority}
            </div>
            <div>
              <strong>Attempts:</strong> {job.attempts}/{job.max_attempts}
            </div>
            <div>
              <strong>Created:</strong>{' '}
              {format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
            </div>
            {job.started_at && (
              <div>
                <strong>Started:</strong>{' '}
                {format(new Date(job.started_at), 'dd MMM yyyy HH:mm', { locale: nl })}
              </div>
            )}
            {job.completed_at && (
              <div>
                <strong>Completed:</strong>{' '}
                {format(new Date(job.completed_at), 'dd MMM yyyy HH:mm', { locale: nl })}
              </div>
            )}
            {job.worker_id && (
              <div>
                <strong>Worker:</strong> {job.worker_id}
              </div>
            )}
          </div>

          {job.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <strong className="text-red-700">Error:</strong>
              <p className="text-red-600 text-sm mt-1">{job.error_message}</p>
            </div>
          )}

          <div>
            <strong>Payload:</strong>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(job.payload || {
                image_url: job.image_url,
                artist: job.artist,
                title: job.title,
                source_id: job.source_id
              }, null, 2)}
            </pre>
          </div>

          {job.result && (
            <div>
              <strong>Result:</strong>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          )}

          {job.output_url && (
            <div>
              <strong>Output:</strong>
              <a 
                href={job.output_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-2"
              >
                View Output
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateJobDialog({ onSubmit }: { onSubmit: (type: string, payload: Record<string, unknown>, priority: number) => void }) {
  const [type, setType] = useState('gif');
  const [payloadStr, setPayloadStr] = useState('{}');
  const [priority, setPriority] = useState(0);

  const handleSubmit = () => {
    try {
      const payload = JSON.parse(payloadStr);
      onSubmit(type, payload, priority);
    } catch (e) {
      alert('Invalid JSON payload');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Render Job</DialogTitle>
          <DialogDescription>
            Maak een nieuwe job aan voor de render queue
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gif">GIF Rendering</SelectItem>
                <SelectItem value="video">Video Rendering</SelectItem>
                <SelectItem value="poster">Poster Generation</SelectItem>
                <SelectItem value="discogs">Discogs Fetch</SelectItem>
                <SelectItem value="ai_audio">AI Audio Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Input 
              type="number" 
              value={priority} 
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Payload (JSON)</label>
            <textarea
              className="w-full h-32 p-2 border rounded-md text-sm font-mono"
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              placeholder='{"image_url": "...", "artist": "...", "title": "..."}'
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Aanmaken
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkerExampleCode() {
  const workerCode = generateWorkerExampleCode('https://ssxbpyqnjfiyubsuonar.supabase.co');
  
  const copyCode = () => {
    navigator.clipboard.writeText(workerCode);
    toast.success('Code gekopieerd naar clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Fly.io Worker Code
            </CardTitle>
            <CardDescription>
              Kopieer deze code naar je Fly.io worker
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copyCode}>
            <Copy className="h-4 w-4 mr-2" />
            Kopieer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
          <pre className="text-xs font-mono whitespace-pre">{workerCode}</pre>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium">Environment variables:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><code className="bg-muted px-1 rounded">WORKER_API_URL</code> = https://ssxbpyqnjfiyubsuonar.supabase.co</li>
            <li><code className="bg-muted px-1 rounded">WORKER_SECRET</code> = Je worker secret key</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RenderQueue() {
  const { 
    jobs, 
    stats, 
    isLoading, 
    statusFilter, 
    setStatusFilter, 
    refetch,
    createJob,
    retryJob,
    deleteJob,
    clearByStatus 
  } = useRenderQueue();

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎛️ Render Queue</h1>
          <p className="text-muted-foreground">
            Beheer async render jobs voor GIF/Video, Discogs, Posters & AI Audio
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Auto-refresh aan
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Auto-refresh uit
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateJobDialog 
            onSubmit={(type, payload, priority) => createJob.mutate({ type, payload, priority })} 
          />
        </div>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue ({stats?.total || 0})</TabsTrigger>
          <TabsTrigger value="worker-code">Worker Code</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
                <CardDescription>Totaal</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-yellow-700">{stats?.pending || 0}</CardTitle>
                <CardDescription className="text-yellow-600">Pending</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-blue-700">{stats?.running || 0}</CardTitle>
                <CardDescription className="text-blue-600">Running</CardDescription>
              </CardHeader>
              {(stats?.running || 0) > 0 && (
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('reset-stuck-render-jobs', {
                          body: { minutes: 5 }
                        });
                        if (error) throw error;
                        toast.success(`${data.reset_count} stuck jobs gereset naar pending`);
                        refetch();
                      } catch (err) {
                        toast.error('Reset mislukt: ' + (err as Error).message);
                      }
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset Stuck Jobs
                  </Button>
                </CardContent>
              )}
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-green-700">{stats?.done || 0}</CardTitle>
                <CardDescription className="text-green-600">Done</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-red-700">{stats?.error || 0}</CardTitle>
                <CardDescription className="text-red-600">Errors</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Filter & Actions */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="w-48">
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

            {(stats?.error || 0) > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearByStatus.mutate('error')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Errors
              </Button>
            )}
            {(stats?.done || 0) > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearByStatus.mutate('done')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Done
              </Button>
            )}
          </div>

          {/* Jobs Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Geen jobs gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Badge className={`${statusColors[job.status]} flex items-center gap-1 w-fit`}>
                            {statusIcons[job.status]}
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {job.type || job.source_type || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {job.artist && job.title 
                            ? `${job.artist} - ${job.title}`
                            : job.payload?.artist && job.payload?.title
                            ? `${job.payload.artist} - ${job.payload.title}`
                            : job.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={job.attempts >= job.max_attempts ? 'text-red-500 font-medium' : ''}>
                            {job.attempts}/{job.max_attempts}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(job.created_at), 'dd/MM HH:mm', { locale: nl })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <JobDetailsDialog job={job} />
                            {(job.status === 'error' || job.status === 'failed') && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => retryJob.mutate(job)}
                                title="Retry job"
                              >
                                <Play className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteJob.mutate(job.id)}
                              title="Delete job"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Worker Endpoints Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔌 Worker Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">POST /functions/v1/claim_next_render_job</p>
                  <p className="text-muted-foreground text-xs">
                    Claim next job (beveiligd met X-WORKER-KEY header)
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">POST /functions/v1/update_render_job_status</p>
                  <p className="text-muted-foreground text-xs">
                    Update job status (beveiligd met X-WORKER-KEY header)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">SKIP LOCKED atomaire claiming</Badge>
                <Badge variant="outline">Max 3 retry attempts</Badge>
                <Badge variant="outline">5 min stale lock timeout</Badge>
                <Badge variant="outline">Priority-based ordering</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worker-code">
          <WorkerExampleCode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
