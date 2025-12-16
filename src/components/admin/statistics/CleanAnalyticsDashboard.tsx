import React, { useState, useMemo } from 'react';
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
  TrendingDown,
  Monitor, 
  Smartphone, 
  Tablet,
  Activity,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  FileText,
  Clock,
  Search,
  Share2,
  Link2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  useCleanAnalyticsOverview, 
  useCleanAnalyticsSummary, 
  useCleanAnalyticsByCountry,
  useRecentCleanAnalytics,
  DateRangeParams
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, subWeeks, differenceInDays, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface CleanAnalyticsDashboardProps {
  dateRange: DateRangeParams;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const CATEGORY_COLORS: Record<string, string> = {
  search: '#10b981',
  social: '#8b5cf6',
  direct: 'hsl(var(--primary))',
  referral: '#f59e0b',
  other: 'hsl(var(--muted-foreground))',
};

// Calculate comparison periods
const getComparisonRanges = (dateRange: DateRangeParams) => {
  const daysDiff = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
  const isToday = daysDiff === 1;
  
  // Previous period (same length before current period)
  const prevPeriodEnd = subDays(dateRange.startDate, 1);
  const prevPeriodStart = subDays(prevPeriodEnd, daysDiff - 1);
  
  // Same day last week (only relevant for single day)
  const sameDayLastWeek = isToday ? {
    startDate: subWeeks(dateRange.startDate, 1),
    endDate: subWeeks(dateRange.endDate, 1),
  } : null;
  
  return {
    previousPeriod: { startDate: startOfDay(prevPeriodStart), endDate: prevPeriodEnd },
    sameDayLastWeek,
    isToday,
  };
};

// Comparison badge component
const ComparisonBadge: React.FC<{ current: number; previous: number; label?: string }> = ({ 
  current, 
  previous,
  label 
}) => {
  if (previous === 0) return null;
  
  const diff = current - previous;
  const percentChange = ((diff / previous) * 100).toFixed(1);
  const isPositive = diff >= 0;
  
  return (
    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{isPositive ? '+' : ''}{percentChange}%</span>
      {label && <span className="text-muted-foreground">vs {label}</span>}
    </div>
  );
};

export const CleanAnalyticsDashboard: React.FC<CleanAnalyticsDashboardProps> = ({ dateRange }) => {
  const [showDatacenter, setShowDatacenter] = useState(false);
  
  // Calculate comparison ranges
  const { previousPeriod, sameDayLastWeek, isToday } = useMemo(
    () => getComparisonRanges(dateRange), 
    [dateRange]
  );
  
  // Current period data
  const { data: overview, isLoading: loadingOverview } = useCleanAnalyticsOverview(dateRange);
  const { data: summary, isLoading: loadingSummary } = useCleanAnalyticsSummary(dateRange);
  const { data: byCountry, isLoading: loadingCountry } = useCleanAnalyticsByCountry(dateRange);
  const { data: recentRecords, isLoading: loadingRecent } = useRecentCleanAnalytics(100);
  
  // Previous period data for comparison
  const { data: prevOverview } = useCleanAnalyticsOverview(previousPeriod);
  
  // Same day last week data (only for single day)
  const { data: lastWeekOverview } = useCleanAnalyticsOverview(
    sameDayLastWeek || { startDate: new Date(), endDate: new Date() },
    { enabled: !!sameDayLastWeek }
  );

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

  const qualityColor = (overview?.qualityScore || 0) >= 80 
    ? 'text-green-500' 
    : (overview?.qualityScore || 0) >= 60 
      ? 'text-yellow-500' 
      : 'text-red-500';

  const deviceIconMap: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    bot: <Server className="h-4 w-4" />,
    tv: <Monitor className="h-4 w-4" />,
    unknown: <Activity className="h-4 w-4" />,
  };

  const categoryIconMap: Record<string, React.ReactNode> = {
    search: <Search className="h-4 w-4" />,
    social: <Share2 className="h-4 w-4" />,
    direct: <Users className="h-4 w-4" />,
    referral: <Link2 className="h-4 w-4" />,
    other: <Globe className="h-4 w-4" />,
  };

  // Chart data for daily trend
  const trendData = (summary || []).slice(0, 14).reverse().map(item => ({
    date: format(new Date(item.date), 'd MMM', { locale: nl }),
    'Unieke Sessies': item.unique_sessions,
    'Echte Pageviews': item.real_users,
    'Datacenter': showDatacenter ? item.datacenter_hits : 0,
  }));

  // Pie chart data for traffic split
  const trafficSplitData = [
    { name: 'Echte Gebruikers', value: overview?.realUsers || 0 },
    { name: 'Datacenter/Bots', value: overview?.datacenterHits || 0 },
  ];

  // Referrer category data
  const referrerCategoryData = ['search', 'social', 'direct', 'referral'].map(cat => {
    const sources = (overview?.referrerSources || []).filter(s => s.category === cat);
    return {
      name: cat === 'search' ? 'Zoekmachines' : cat === 'social' ? 'Social Media' : cat === 'direct' ? 'Direct' : 'Referrals',
      sessions: sources.reduce((a, b) => a + b.unique_sessions, 0),
      category: cat,
    };
  }).filter(d => d.sessions > 0);

  // Hourly distribution chart
  const hourlyData = (overview?.hourlyDistribution || []).map(h => ({
    hour: `${h.hour}:00`,
    'Echte Gebruikers': h.real_users,
    'Datacenter': showDatacenter ? h.datacenter : 0,
  }));

  // Get comparison label
  const daysDiff = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
  const compLabel = daysDiff === 1 ? 'gisteren' : `vorige ${daysDiff} dagen`;

  return (
    <div className="space-y-6">
      {/* Date Indicator Header */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(dateRange.startDate, 'd MMMM yyyy', { locale: nl })}
                {daysDiff > 1 && (
                  <>
                    {' '}-{' '}
                    {format(dateRange.endDate, 'd MMMM yyyy', { locale: nl })}
                  </>
                )}
              </span>
              <Badge variant="outline">{daysDiff} {daysDiff === 1 ? 'dag' : 'dagen'}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Vergelijking: {format(previousPeriod.startDate, 'd MMM', { locale: nl })} - {format(previousPeriod.endDate, 'd MMM', { locale: nl })}</span>
              {isToday && sameDayLastWeek && (
                <span className="border-l pl-4">+ {format(sameDayLastWeek.startDate, 'd MMM', { locale: nl })} (vorige week)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Summary Row */}
      {prevOverview && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium">Vergelijking met {compLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {format(previousPeriod.startDate, 'd MMM', { locale: nl })} - {format(previousPeriod.endDate, 'd MMM', { locale: nl })}
                </p>
              </div>
              <div className="flex gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Sessies</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{overview?.uniqueSessions || 0}</span>
                    <ComparisonBadge current={overview?.uniqueSessions || 0} previous={prevOverview?.uniqueSessions || 0} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pageviews</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{overview?.realUsers || 0}</span>
                    <ComparisonBadge current={overview?.realUsers || 0} previous={prevOverview?.realUsers || 0} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Datacenter</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{overview?.datacenterHits || 0}</span>
                    <ComparisonBadge current={overview?.datacenterHits || 0} previous={prevOverview?.datacenterHits || 0} />
                  </div>
                </div>
                {isToday && lastWeekOverview && (
                  <div className="text-center border-l pl-6">
                    <p className="text-xs text-muted-foreground mb-1">vs Vorige Week</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{overview?.uniqueSessions || 0}</span>
                      <ComparisonBadge current={overview?.uniqueSessions || 0} previous={lastWeekOverview?.uniqueSessions || 0} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPI Cards with Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unieke Sessies</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {(overview?.uniqueSessions || 0).toLocaleString()}
            </div>
            <ComparisonBadge 
              current={overview?.uniqueSessions || 0} 
              previous={prevOverview?.uniqueSessions || 0}
              label={compLabel}
            />
            {isToday && sameDayLastWeek && lastWeekOverview && (
              <ComparisonBadge 
                current={overview?.uniqueSessions || 0} 
                previous={lastWeekOverview?.uniqueSessions || 0}
                label="vorige week"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Alleen echte gebruikers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kwaliteitsscore</CardTitle>
            <Shield className={`h-4 w-4 ${qualityColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${qualityColor}`}>
              {overview?.totalHits === 0 ? 'N/A' : `${overview?.qualityScore || 0}%`}
            </div>
            <Progress 
              value={overview?.qualityScore || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Gem. confidence echte traffic
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagina's/Sessie</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.pagesPerSession || 0}
            </div>
            <ComparisonBadge 
              current={overview?.pagesPerSession || 0} 
              previous={prevOverview?.pagesPerSession || 0}
              label={compLabel}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Engagement metric
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
              {overview?.totalHits ? Math.round((overview.datacenterHits / overview.totalHits) * 100) : 0}% gefilterd
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purity Score</CardTitle>
            <Shield className={`h-4 w-4 ${purityColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${purityColor}`}>
              {overview?.totalHits === 0 ? 'N/A' : `${overview?.purityScore || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Max 97% (onzekerheid)
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

      {/* Charts Row 1 */}
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

        {/* Referrer Sources Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verkeersbronnen (Echte Gebruikers)</CardTitle>
            <CardDescription>Hoe bezoekers ons vinden</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={referrerCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {referrerCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dagelijkse Trend (Echte Gebruikers)</CardTitle>
          <CardDescription>Unieke sessies en pageviews per dag</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="Unieke Sessies" 
                  stroke="#10b981" 
                  fill="#10b98133"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="Echte Pageviews" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                {showDatacenter && (
                  <Area 
                    type="monotone" 
                    dataKey="Datacenter" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive) / 0.2)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Uurverdeling (UTC)
          </CardTitle>
          <CardDescription>Wanneer echte gebruikers actief zijn</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" fontSize={10} interval={2} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="Echte Gebruikers" fill="hsl(var(--primary))" />
              {showDatacenter && (
                <Bar dataKey="Datacenter" fill="hsl(var(--destructive))" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

        {/* Top Referrer Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Bronnen</CardTitle>
            <CardDescription>Echte gebruikers per bron</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.referrerSources.slice(0, 6).map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {categoryIconMap[item.category] || <Globe className="h-4 w-4" />}
                    <span className="text-sm truncate max-w-[120px]" title={item.source}>
                      {item.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{item.avg_score}%</Badge>
                    <Badge variant="secondary">{item.unique_sessions}</Badge>
                  </div>
                </div>
              ))}
              {(!overview?.referrerSources || overview.referrerSources.length === 0) && (
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

      {/* Top Pages (Real Users Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Top Pagina's (Echte Gebruikers)
          </CardTitle>
          <CardDescription>Populairste content zonder datacenter traffic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Pagina</th>
                  <th className="text-right py-2 px-2">Sessies</th>
                  <th className="text-right py-2 px-2">Pageviews</th>
                  <th className="text-right py-2 px-2">Kwaliteit</th>
                </tr>
              </thead>
              <tbody>
                {overview?.topPages.slice(0, 10).map((page) => (
                  <tr key={page.path} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 truncate max-w-[300px]" title={page.path}>
                      {page.path}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">{page.unique_sessions}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{page.hits}</td>
                    <td className="py-2 px-2 text-right">
                      <Badge variant={page.avg_score >= 80 ? 'default' : page.avg_score >= 60 ? 'secondary' : 'destructive'}>
                        {page.avg_score}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Country Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Landen (Alleen Echte Gebruikers)
          </CardTitle>
          <CardDescription>Gesorteerd op unieke sessies</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCountry ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(byCountry || []).slice(0, 10)} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="display_country" type="category" width={100} fontSize={12} />
                <Tooltip formatter={(value, name) => [value, name === 'unique_sessions' ? 'Sessies' : 'Hits']} />
                <Bar dataKey="unique_sessions" fill="#10b981" name="Sessies" />
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
