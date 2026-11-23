import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Activity, Play, RefreshCw } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const db = supabase as any;
const JOBS = [
  { job: 'trading-sync', label: 'Discogs listings & wantlists', schedule: 'elke 2 uur' },
  { job: 'trading-market-check', label: 'Marktprijzen', schedule: 'elk uur' },
  { job: 'trading-auto-price', label: 'Automatisch prijzen', schedule: 'elk uur' },
  { job: 'trading-discogs-news', label: 'Discogs-nieuws', schedule: 'elke 3 uur' },
];

export default function TradingMonitor() {
  const runs = useQuery({
    queryKey: ['admin', 'trading-runs'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await db.from('trading_job_runs').select('*').order('started_at', { ascending: false }).limit(80);
      if (error) throw error;
      return data ?? [];
    },
  });
  const counts = useQuery({
    queryKey: ['admin', 'trading-counts'],
    queryFn: async () => {
      const tables = ['trading_inventory_items', 'trading_wantlist_items', 'trading_price_snapshots', 'trading_alerts', 'trading_auto_price_rules', 'push_subscriptions'];
      const res = await Promise.all(tables.map((t) => db.from(t).select('*', { count: 'exact', head: true })));
      return Object.fromEntries(tables.map((t, i) => [t, res[i].count ?? 0]));
    },
  });

  const runNow = async (job: string) => {
    const { data, error } = await supabase.functions.invoke(job, { body: {} });
    if (error) {
      const d = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      toast.error(`${job} mislukt`, { description: d.slice(0, 200) });
    } else toast.success(`${job} klaar`, { description: JSON.stringify(data).slice(0, 160) });
    runs.refetch(); counts.refetch();
  };

  const last = (job: string) => (runs.data ?? []).find((r: any) => r.job === job);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Activity className="h-6 w-6" />Trading Desk Monitor</h1>
          <p className="text-sm text-muted-foreground">Alle jobs draaien automatisch. Handmatig starten verwerkt alleen jouw eigen account (nieuws: alle gebruikers).</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { runs.refetch(); counts.refetch(); }}><RefreshCw className="mr-1 h-4 w-4" />Vernieuwen</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {JOBS.map((j) => {
          const r = last(j.job);
          return (
            <Card key={j.job}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{j.label}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="text-muted-foreground">Schema: {j.schedule}</div>
                {r ? (
                  <>
                    <Badge variant={r.status === 'error' ? 'destructive' : 'secondary'}>{r.status ?? 'bezig'}</Badge>
                    <div>{new Date(r.started_at).toLocaleString('nl-NL')}</div>
                    <div className="text-muted-foreground">gebruikers {r.users_processed ?? 0} · items {r.items_processed ?? 0} · meldingen {r.alerts_created ?? 0}</div>
                    {r.error && <div className="text-destructive">{r.error}</div>}
                  </>
                ) : <div className="text-muted-foreground">Nog niet gedraaid</div>}
                <Button size="sm" variant="outline" className="w-full" onClick={() => runNow(j.job)}><Play className="mr-1 h-3 w-3" />Nu starten</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Aantallen</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(counts.data ?? {}).map(([k, v]) => (
            <div key={k}><div className="text-xs text-muted-foreground">{k.replace('trading_', '').replace(/_/g, ' ')}</div><div className="text-lg font-semibold tabular-nums">{v as number}</div></div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Laatste runs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1">Job</th><th>Start</th><th>Duur</th><th>Status</th><th>Items</th><th>Meldingen</th><th>Details</th></tr></thead>
            <tbody>
              {(runs.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="py-1">{r.job}</td>
                  <td>{new Date(r.started_at).toLocaleString('nl-NL')}</td>
                  <td>{r.finished_at ? `${Math.round((Date.parse(r.finished_at) - Date.parse(r.started_at)) / 1000)}s` : '…'}</td>
                  <td className={r.status === 'error' ? 'text-destructive' : ''}>{r.status ?? 'bezig'}</td>
                  <td>{r.items_processed ?? 0}</td>
                  <td>{r.alerts_created ?? 0}</td>
                  <td className="max-w-[360px] truncate text-muted-foreground" title={JSON.stringify(r.details)}>{r.error ?? JSON.stringify(r.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
