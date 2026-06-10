import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Eye, MousePointerClick, Clock, TrendingUp, Globe, Monitor, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type GaReport = { rows?: GaRow[]; totals?: GaRow[] };

interface AnalyticsData {
  success: boolean;
  error?: string;
  propertyId?: string;
  range?: string;
  overview?: GaReport;
  timeseries?: GaReport;
  topPages?: GaReport;
  sources?: GaReport;
  devices?: GaReport;
  countries?: GaReport;
  realtime?: GaReport;
  events?: GaReport;
}

const RANGES = [
  { label: 'Vandaag', value: 'today' },
  { label: '7 dagen', value: '7daysAgo' },
  { label: '28 dagen', value: '28daysAgo' },
  { label: '90 dagen', value: '90daysAgo' },
];

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const formatDate = (yyyymmdd: string) =>
  `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}`;

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
};

const formatNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);

export default function Analytics() {
  const [range, setRange] = useState('28daysAgo');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke('ga4-analytics', {
        body: { range },
      });
      if (fnErr) throw fnErr;
      if (!res?.success) throw new Error(res?.error || 'Onbekende fout');
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const overviewTotals = data?.overview?.rows?.[0]?.metricValues || [];
  const [activeUsers, newUsers, sessions, pageViews, avgDuration, bounceRate, engagementRate] =
    overviewTotals.map((v) => parseFloat(v.value));

  const timeseriesData =
    data?.timeseries?.rows?.map((r) => ({
      date: formatDate(r.dimensionValues?.[0]?.value || ''),
      users: parseInt(r.metricValues?.[0]?.value || '0'),
      views: parseInt(r.metricValues?.[1]?.value || '0'),
      sessions: parseInt(r.metricValues?.[2]?.value || '0'),
    })) || [];

  const sourcesData =
    data?.sources?.rows?.map((r) => ({
      name: r.dimensionValues?.[0]?.value || 'Onbekend',
      sessions: parseInt(r.metricValues?.[0]?.value || '0'),
    })) || [];

  const devicesData =
    data?.devices?.rows?.map((r) => ({
      name: r.dimensionValues?.[0]?.value || 'Onbekend',
      value: parseInt(r.metricValues?.[0]?.value || '0'),
    })) || [];

  const realtimeActive = parseInt(data?.realtime?.rows?.[0]?.metricValues?.[0]?.value || '0');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live data uit Google Analytics 4
            {data?.propertyId && ` · Property ${data.propertyId}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium">{realtimeActive}</span>
            <span className="text-xs text-muted-foreground">nu actief</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Vernieuwen
          </Button>
        </div>
      </div>

      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          {RANGES.map((r) => (
            <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Fout: {error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Controleer dat het service account uit GOOGLE_SERVICE_ACCOUNT_KEY toegevoegd is als Viewer in GA4 → Admin → Property Access Management.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Actieve gebruikers" value={formatNumber(activeUsers || 0)} />
            <KpiCard icon={TrendingUp} label="Nieuwe gebruikers" value={formatNumber(newUsers || 0)} />
            <KpiCard icon={MousePointerClick} label="Sessies" value={formatNumber(sessions || 0)} />
            <KpiCard icon={Eye} label="Paginaweergaven" value={formatNumber(pageViews || 0)} />
            <KpiCard icon={Clock} label="Gem. duur" value={formatDuration(avgDuration || 0)} />
            <KpiCard icon={TrendingUp} label="Engagement" value={`${((engagementRate || 0) * 100).toFixed(1)}%`} />
            <KpiCard icon={TrendingUp} label="Bounce rate" value={`${((bounceRate || 0) * 100).toFixed(1)}%`} />
            <KpiCard icon={Globe} label="Landen" value={`${data.countries?.rows?.length || 0}`} />
          </div>

          {/* Timeseries chart */}
          <Card>
            <CardHeader><CardTitle>Verkeer over tijd</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" name="Gebruikers" strokeWidth={2} />
                  <Line type="monotone" dataKey="views" stroke="#10b981" name="Weergaven" strokeWidth={2} />
                  <Line type="monotone" dataKey="sessions" stroke="#f59e0b" name="Sessies" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            <Card>
              <CardHeader><CardTitle>Verkeersbronnen</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourcesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sessies" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader><CardTitle><Monitor className="inline h-4 w-4 mr-2" />Apparaten</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={devicesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(e) => `${e.name}: ${e.value}`}
                    >
                      {devicesData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader><CardTitle>Top pagina's</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Pagina</th>
                      <th className="text-right py-2 font-medium">Weergaven</th>
                      <th className="text-right py-2 font-medium">Gebruikers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages?.rows?.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-2">
                          <div className="font-medium truncate max-w-md">
                            {r.dimensionValues?.[1]?.value || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-md">
                            {r.dimensionValues?.[0]?.value}
                          </div>
                        </td>
                        <td className="text-right py-2">{r.metricValues?.[0]?.value}</td>
                        <td className="text-right py-2">{r.metricValues?.[1]?.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Countries */}
            <Card>
              <CardHeader><CardTitle><Globe className="inline h-4 w-4 mr-2" />Top landen</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.countries?.rows?.slice(0, 10).map((r, i) => {
                    const users = parseInt(r.metricValues?.[0]?.value || '0');
                    const max = parseInt(data.countries?.rows?.[0]?.metricValues?.[0]?.value || '1');
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{r.dimensionValues?.[0]?.value}</span>
                          <span className="font-medium">{users}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(users / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader><CardTitle>Top events</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {data.events?.rows?.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 font-mono text-xs">{r.dimensionValues?.[0]?.value}</td>
                        <td className="text-right py-2 font-medium">{r.metricValues?.[0]?.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
