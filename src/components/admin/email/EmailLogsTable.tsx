import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const EmailLogsTable = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/10 text-green-600';
      case 'failed':
        return 'bg-red-500/10 text-red-600';
      case 'pending':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily_digest':
        return 'bg-blue-500/10 text-blue-600';
      case 'weekly_discussion':
        return 'bg-purple-500/10 text-purple-600';
      case 'test':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Email Logs</CardTitle>
        <CardDescription>Laatste 50 verzonden emails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left p-2">Datum & Tijd</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Ontvanger</th>
                <th className="text-left p-2">Onderwerp</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 text-muted-foreground">
                    {new Date(log.sent_at).toLocaleString('nl-NL')}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={getTypeColor(log.email_type)}>
                      {log.email_type}
                    </Badge>
                  </td>
                  <td className="p-2">{log.recipient_email}</td>
                  <td className="p-2 max-w-[200px] truncate">
                    {log.subject || '-'}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge variant="outline" className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs || logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Geen email logs gevonden
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
