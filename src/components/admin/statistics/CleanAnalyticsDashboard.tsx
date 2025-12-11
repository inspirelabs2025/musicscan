import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Server, 
  Globe, 
  Shield, 
  TrendingUp, 
  Monitor, 
  Smartphone, 
  Tablet,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  useCleanAnalyticsOverview, 
  useCleanAnalyticsSummary, 
  useCleanAnalyticsByCountry,
  useRecentCleanAnalytics 
} from '@/hooks/useCleanAnalytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface CleanAnalyticsDashboardProps {
  days: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted))', '#10b981', '#f59e0b', '#8b5cf6'];

export const CleanAnalyticsDashboard: React.FC<CleanAnalyticsDashboardProps> = ({ days }) => {
  const [showDatacenter, setShowDatacenter] = useState(false);
  
  const { data: overview, isLoading: loadingOverview } = useCleanAnalyticsOverview(days);
  const { data: summary, isLoading: loadingSummary } = useCleanAnalyticsSummary(days);
  const { data: byCountry, isLoading: loadingCountry } = useCleanAnalyticsByCountry(days);
  const { data: recentRecords, isLoading: loadingRecent } = useRecentCleanAnalytics(100);

  if (loadingOverview) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const purityColor = (overview?.purityScore || 0) >= 80 
    ? 'text-green-500' 
    : (overview?.purityScore || 0) >= 50 
      ? 'text-yellow-500' 
      : 'text-red-500';

  const deviceIconMap: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    bot: <Server className="h-4 w-4" />,
    unknown: <Activity className="h-4 w-4" />,
  };

  // Chart data for daily trend
  const trendData = (summary || []).slice(0, 14).reverse().map(item => ({
    date: format(new Date(item.date), 'd MMM', { locale: nl }),
    'Echte Gebruikers': item.real_users,
    'Datacenter': showDatacenter ? item.datacenter_hits : 0,
    'Purity %': item.purity_score,
  }));

  // Pie chart data for traffic split
  const trafficSplitData = [
    { name: 'Echte Gebruikers', value: overview?.realUsers || 0 },
    { name: 'Datacenter/Bots', value: overview?.datacenterHits || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purity Score</CardTitle>
            <Shield className={`h-4 w-4 ${purityColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${purityColor}`}>
              {overview?.purityScore || 0}%
            </div>
            <Progress 
              value={overview?.purityScore || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Percentage echte gebruikers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Echte Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {(overview?.realUsers || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Gemiddelde score: {overview?.avgRealScore || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datacenter Traffic</CardTitle>
            <Server className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(overview?.datacenterHits || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Gefilterd uit statistieken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Hits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overview?.totalHits || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Laatste {days} dagen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toggle for showing datacenter */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-datacenter"
          checked={showDatacenter}
          onCheckedChange={setShowDatacenter}
        />
        <Label htmlFor="show-datacenter">Toon datacenter nodes in grafieken</Label>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Split Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Verdeling</CardTitle>
            <CardDescription>Echte gebruikers vs datacenter traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trafficSplitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trafficSplitData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dagelijkse Trend</CardTitle>
            <CardDescription>Echte gebruikers per dag</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Echte Gebruikers" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                  />
                  {showDatacenter && (
                    <Line 
                      type="monotone" 
                      dataKey="Datacenter" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Apparaten</CardTitle>
            <CardDescription>Alleen echte gebruikers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.deviceBreakdown.map((item) => (
                <div key={item.device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {deviceIconMap[item.device] || <Activity className="h-4 w-4" />}
                    <span className="capitalize">{item.device}</span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
              {(!overview?.deviceBreakdown || overview.deviceBreakdown.length === 0) && (
                <p className="text-muted-foreground text-sm">Geen data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browsers</CardTitle>
            <CardDescription>Alleen echte gebruikers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.browserBreakdown.slice(0, 5).map((item) => (
                <div key={item.browser} className="flex items-center justify-between">
                  <span>{item.browser}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
              {(!overview?.browserBreakdown || overview.browserBreakdown.length === 0) && (
                <p className="text-muted-foreground text-sm">Geen data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datacenter Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Gefilterde Traffic
            </CardTitle>
            <CardDescription>Datacenter & bot herkenning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.datacenterBreakdown.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[150px]" title={item.name}>
                    {item.name}
                  </span>
                  <Badge variant="destructive">{item.count}</Badge>
                </div>
              ))}
              {(!overview?.datacenterBreakdown || overview.datacenterBreakdown.length === 0) && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Geen datacenter traffic</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Landen (Alleen Echte Gebruikers)
          </CardTitle>
          <CardDescription>Gefilterde locatiedata zonder datacenter traffic</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCountry ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(byCountry || []).slice(0, 10)} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="display_country" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="hit_count" fill="hsl(var(--primary))" name="Hits" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recente Activiteit</CardTitle>
          <CardDescription>Laatste 20 pageviews met classificatie</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Tijd</th>
                    <th className="text-left py-2 px-2">Locatie</th>
                    <th className="text-left py-2 px-2">Pad</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords?.slice(0, 20).map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 text-muted-foreground">
                        {format(new Date(record.created_at), 'HH:mm:ss', { locale: nl })}
                      </td>
                      <td className="py-2 px-2">
                        {record.city && record.country 
                          ? `${record.city}, ${record.country}`
                          : record.country || 'Unknown'}
                      </td>
                      <td className="py-2 px-2 truncate max-w-[200px]" title={record.path || ''}>
                        {record.path || '/'}
                      </td>
                      <td className="py-2 px-2">
                        {record.is_datacenter ? (
                          <Badge variant="destructive" className="text-xs">
                            {record.datacenter_name || 'Datacenter'}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-500">
                            {record.device_type || 'User'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <span className={record.real_user_score >= 70 ? 'text-green-500' : record.real_user_score >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                          {record.real_user_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
