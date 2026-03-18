import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DailyStatsEmailControl = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSendTest = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-daily-stats-email');

      if (error) throw error;

      setResult(data);
      toast.success('Dagelijks rapport verstuurd!');
    } catch (error: any) {
      console.error('Error sending daily stats email:', error);
      toast.error('Fout bij versturen: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Dagelijks Stats Rapport</CardTitle>
        </div>
        <CardDescription>
          Automatisch dagelijks om 08:00 UTC. Bevat bezoekers, scans, top pagina's, conversies en meer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Cronjob actief</p>
            <p className="text-xs text-muted-foreground">Elke dag om 08:00 UTC</p>
          </div>
        </div>

        {result && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p className="font-medium text-green-600">✅ Verstuurd!</p>
            <p className="text-muted-foreground">Sessies: {result.stats?.sessions} | Scans: {result.stats?.scans} | Nieuwe users: {result.stats?.newUsers}</p>
          </div>
        )}

        <Button
          onClick={handleSendTest}
          disabled={isSending}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Versturen...' : 'Verstuur Nu (Test)'}
        </Button>
      </CardContent>
    </Card>
  );
};
