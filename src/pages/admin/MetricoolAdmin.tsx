import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Play,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface MetricoolCredentials {
  userToken: string;
  userId: string;
  blogId: string;
}

interface QueueItem {
  id: string;
  content_type: string;
  title: string;
  content: string;
  media_url: string | null;
  target_platforms: string[];
  scheduled_for: string;
  status: string;
  attempts: number;
  error_message: string | null;
  created_at: string;
}

interface PostLog {
  id: string;
  content_type: string;
  title: string;
  target_platforms: string[];
  status: string;
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', color: 'bg-black' },
  { id: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { id: 'twitter', label: 'X/Twitter', color: 'bg-black' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'bluesky', label: 'Bluesky', color: 'bg-sky-500' },
];

export default function MetricoolAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<MetricoolCredentials>({
    userToken: '',
    userId: '',
    blogId: ''
  });
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<PostLog[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  const [scheduling, setScheduling] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    posted: 0,
    failed: 0,
    today: 0
  });

  useEffect(() => {
    loadCredentials();
    loadQueue();
    loadLogs();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('app_secrets')
        .select('secret_key, secret_value')
        .in('secret_key', ['METRICOOL_USER_TOKEN', 'METRICOOL_USER_ID', 'METRICOOL_BLOG_ID']);

      if (error) throw error;

      const creds: MetricoolCredentials = { userToken: '', userId: '', blogId: '' };
      data?.forEach(s => {
        if (s.secret_key === 'METRICOOL_USER_TOKEN') creds.userToken = s.secret_value;
        if (s.secret_key === 'METRICOOL_USER_ID') creds.userId = s.secret_value;
        if (s.secret_key === 'METRICOOL_BLOG_ID') creds.blogId = s.secret_value;
      });
      setCredentials(creds);
      setCredentialsLoaded(true);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const saveCredentials = async () => {
    setLoading(true);
    try {
      const secrets = [
        { secret_key: 'METRICOOL_USER_TOKEN', secret_value: credentials.userToken },
        { secret_key: 'METRICOOL_USER_ID', secret_value: credentials.userId },
        { secret_key: 'METRICOOL_BLOG_ID', secret_value: credentials.blogId }
      ];

      for (const secret of secrets) {
        const { error } = await supabase
          .from('app_secrets')
          .upsert(secret, { onConflict: 'secret_key' });
        if (error) throw error;
      }

      toast({ title: 'Opgeslagen', description: 'Metricool credentials zijn opgeslagen.' });
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_post_queue')
        .select('*')
        .order('scheduled_for', { ascending: true })
        .limit(50);

      if (error) throw error;
      setQueue(data || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const pending = data?.filter(q => q.status === 'pending').length || 0;
      const posted = data?.filter(q => q.status === 'posted').length || 0;
      const failed = data?.filter(q => q.status === 'failed').length || 0;
      const todayPosts = data?.filter(q => q.scheduled_for.startsWith(today)).length || 0;
      
      setStats({ pending, posted, failed, today: todayPosts });
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_post_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const triggerScheduling = async () => {
    setScheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke('schedule-metricool-posts');
      if (error) throw error;
      
      toast({ 
        title: 'Scheduling Gestart', 
        description: `${data?.scheduled_count || 0} posts ingepland.` 
      });
      loadQueue();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } finally {
      setScheduling(false);
    }
  };

  const processNow = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-scheduled-metricool');
      if (error) throw error;
      
      toast({ 
        title: data?.success ? 'Gepost' : 'Mislukt', 
        description: data?.title || 'Geen posts om te verwerken',
        variant: data?.success ? 'default' : 'destructive'
      });
      loadQueue();
      loadLogs();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async (status?: string) => {
    try {
      let query = supabase.from('metricool_post_queue').delete();
      if (status) {
        query = query.eq('status', status);
      }
      
      const { error } = await query;
      if (error) throw error;
      
      toast({ title: 'Queue Geleegd', description: `${status || 'Alle'} items verwijderd.` });
      loadQueue();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Gepost</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Mislukt</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Wachtend</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Bezig</Badge>;
      case 'skipped':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Overgeslagen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isConfigured = credentials.userToken && credentials.userId && credentials.blogId;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Metricool Social Media</h1>
              <p className="text-muted-foreground">
                Automatisch posten naar TikTok, Instagram, Facebook en meer via Metricool
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={triggerScheduling} disabled={scheduling || !isConfigured}>
                <Clock className="h-4 w-4 mr-2" />
                {scheduling ? 'Bezig...' : 'Schedule Posts'}
              </Button>
              <Button onClick={processNow} disabled={loading || !isConfigured}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Bezig...' : 'Post Nu'}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Wachtend</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.posted}</p>
                    <p className="text-sm text-muted-foreground">Gepost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-sm text-muted-foreground">Mislukt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-sm text-muted-foreground">Vandaag</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="queue">
            <TabsList>
              <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
              <TabsTrigger value="logs">Post Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="settings">Instellingen</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Post Queue</CardTitle>
                    <CardDescription>Geplande posts voor Metricool distributie</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadQueue()}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Ververs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => clearQueue('failed')}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear Failed
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {queue.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Geen posts in queue</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Gepland</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pogingen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queue.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="max-w-xs truncate font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.content_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {item.target_platforms.map(p => (
                                  <Badge key={p} variant="secondary" className="text-xs">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(item.scheduled_for), 'dd MMM HH:mm', { locale: nl })}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.attempts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Post Logs</CardTitle>
                  <CardDescription>Historische Metricool posts</CardDescription>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Geen logs beschikbaar</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Gepost</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="max-w-xs truncate font-medium">
                              {log.title || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {log.target_platforms?.map(p => (
                                  <Badge key={p} variant="secondary" className="text-xs">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell className="text-sm">
                              {log.posted_at ? format(new Date(log.posted_at), 'dd MMM HH:mm', { locale: nl }) : '-'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {log.error_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Metricool API Configuratie
                  </CardTitle>
                  <CardDescription>
                    Vind je credentials in Metricool → Account Settings → API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isConfigured && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ Metricool is nog niet geconfigureerd. Vul je API credentials in om te starten.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userToken">User Token</Label>
                      <Input
                        id="userToken"
                        type="password"
                        placeholder="Jouw Metricool User Token"
                        value={credentials.userToken}
                        onChange={(e) => setCredentials({ ...credentials, userToken: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userId">User ID</Label>
                        <Input
                          id="userId"
                          placeholder="Jouw Metricool User ID"
                          value={credentials.userId}
                          onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="blogId">Blog ID</Label>
                        <Input
                          id="blogId"
                          placeholder="Jouw Metricool Blog/Brand ID"
                          value={credentials.blogId}
                          onChange={(e) => setCredentials({ ...credentials, blogId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={saveCredentials} disabled={loading}>
                    {loading ? 'Opslaan...' : 'Credentials Opslaan'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Standaard Platforms</CardTitle>
                  <CardDescription>
                    Selecteer naar welke platforms standaard gepost wordt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {PLATFORMS.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={platform.id}
                          checked={selectedPlatforms.includes(platform.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform.id]);
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                            }
                          }}
                        />
                        <Label htmlFor={platform.id} className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${platform.color}`} />
                          {platform.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automatische Scheduling</CardTitle>
                  <CardDescription>
                    Posts worden dagelijks om 06:00 UTC ingepland en gepost om 10:00, 13:00, 16:00 en 19:00 UTC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cron Active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      schedule-metricool-posts: 0 6 * * * | post-scheduled-metricool: 0 10,13,16,19 * * *
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
