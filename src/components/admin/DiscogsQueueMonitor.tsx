import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface QueueItem {
  id: string;
  discogs_release_id: number;
  artist: string;
  title: string;
  status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  retry_count: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  skipped: number;
}

export const DiscogsQueueMonitor = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['discogs-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discogs_import_log')
        .select('status');

      if (error) throw error;

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
      };

      data.forEach((item) => {
        if (item.status in stats) {
          stats[item.status as keyof QueueStats]++;
        }
      });

      return stats;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: recentItems } = useQuery({
    queryKey: ['discogs-queue-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discogs_import_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as QueueItem[];
    },
    refetchInterval: 10000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "default",
      completed: "secondary",
      failed: "destructive",
      skipped: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discogs Import Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-4">Laden...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.processing || 0}</div>
                      <div className="text-xs text-muted-foreground">Processing</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.skipped || 0}</div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold">{stats?.failed || 0}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recente Import Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Release ID</TableHead>
                  <TableHead>Artiest</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.discogs_release_id}</TableCell>
                    <TableCell>{item.artist}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                    <TableCell>
                      {item.retry_count > 0 && (
                        <Badge variant="outline">{item.retry_count}/3</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('nl-NL')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
