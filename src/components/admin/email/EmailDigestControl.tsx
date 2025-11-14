import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export const EmailDigestControl = () => {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Fetch recent email logs for daily digest
  const { data: recentDigests, refetch } = useQuery({
    queryKey: ['email-logs-daily-digest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('email_type', 'daily_digest')
        .order('sent_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-email-digest', {
        body: { testMode: true }
      });

      if (error) throw error;

      toast.success('Test email verzonden!');
      refetch();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Fout bij versturen test email: ' + error.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendToAll = async () => {
    if (!confirm('Weet je zeker dat je de daily digest naar ALLE gebruikers wilt versturen?')) {
      return;
    }

    setIsSendingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-email-digest', {
        body: { testMode: false }
      });

      if (error) throw error;

      toast.success(`Daily digest verzonden naar ${data?.emailsSent || 0} gebruikers!`);
      refetch();
    } catch (error: any) {
      console.error('Error sending digest to all:', error);
      toast.error('Fout bij versturen: ' + error.message);
    } finally {
      setIsSendingAll(false);
    }
  };

  const lastSent = recentDigests?.[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Daily Email Digest</CardTitle>
        </div>
        <CardDescription>
          Verstuur dagelijkse samenvatting van nieuwe content naar gebruikers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Laatst verzonden</p>
            <p className="text-xs text-muted-foreground">
              {lastSent
                ? new Date(lastSent.sent_at).toLocaleString('nl-NL')
                : 'Nog niet verzonden'}
            </p>
          </div>
          {lastSent?.status === 'sent' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {lastSent?.status === 'failed' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>

        {/* Statistics */}
        {recentDigests && recentDigests.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Succesvol</p>
              <p className="text-2xl font-bold text-green-600">
                {recentDigests.filter(d => d.status === 'sent').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Mislukt</p>
              <p className="text-2xl font-bold text-red-600">
                {recentDigests.filter(d => d.status === 'failed').length}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSendTest}
            disabled={isSendingTest}
            variant="outline"
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSendingTest ? 'Versturen...' : 'Test Email'}
          </Button>
          <Button
            onClick={handleSendToAll}
            disabled={isSendingAll}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSendingAll ? 'Versturen...' : 'Verstuur naar Iedereen'}
          </Button>
        </div>

        {/* Recent sends */}
        {recentDigests && recentDigests.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recente verzendingen:</p>
            <div className="space-y-1">
              {recentDigests.map((digest) => (
                <div
                  key={digest.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                >
                  <span className="text-muted-foreground">
                    {new Date(digest.sent_at).toLocaleString('nl-NL')}
                  </span>
                  <span
                    className={
                      digest.status === 'sent'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {digest.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
