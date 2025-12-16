import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHourlyTraffic, useDailyTraffic } from '@/hooks/useDetailedAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TimeAnalysisProps {
  days: number;
}

export function TimeAnalysis({ days }: TimeAnalysisProps) {
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyTraffic(days);
  // Fetch previous period for comparison (e.g., if days=1, compare to yesterday)
  const { data: prevHourlyData, isLoading: prevHourlyLoading } = useHourlyTraffic(days * 2);
  const { data: dailyData, isLoading: dailyLoading } = useDailyTraffic(Math.min(days, 30));

  if (hourlyLoading || dailyLoading || prevHourlyLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Uurlijkse Verdeling</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dagelijkse Trend</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  // Calculate previous period hourly data (approximate by using difference)
  const getPrevHourlyValue = (hour: number) => {
    // prevHourlyData contains data for 2x the period, so we estimate previous period
    // by taking the total and subtracting current period
    const prevFound = prevHourlyData?.find(h => h.hour_of_day === hour);
    const currFound = hourlyData?.find(h => h.hour_of_day === hour);
    const prevTotal = prevFound ? Number(prevFound.view_count) : 0;
    const currTotal = currFound ? Number(currFound.view_count) : 0;
    return Math.max(0, prevTotal - currTotal);
  };

  // Prepare hourly data with all 24 hours + comparison
  const hourlyChartData = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyData?.find(h => h.hour_of_day === hour);
    const currentViews = found ? Number(found.view_count) : 0;
    const prevViews = getPrevHourlyValue(hour);
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      views: currentViews,
      prevViews: prevViews,
      change: prevViews > 0 ? Math.round(((currentViews - prevViews) / prevViews) * 100) : null,
    };
  });

  // Find peak hour
  const peakHour = hourlyChartData.reduce((max, h) => h.views > max.views ? h : max, hourlyChartData[0]);

  // Prepare daily data
  const dailyChartData = dailyData?.map(d => ({
    date: format(new Date(d.date), 'd MMM', { locale: nl }),
    fullDate: d.date,
    views: Number(d.total_views),
    sessions: Number(d.unique_sessions),
    facebook: Number(d.from_facebook),
  })) || [];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uurlijkse Verdeling</span>
              <span className="text-sm font-normal text-muted-foreground">
                Piekuur: {peakHour.hour} ({peakHour.views} views)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(), 
                    name === 'views' ? 'Nu' : 'Vorige periode'
                  ]}
                  labelFormatter={(label) => `Tijd: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="prevViews" 
                  name="Vorige periode"
                  fill="hsl(var(--muted-foreground) / 0.3)" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="views" 
                  name="Nu"
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vergelijking per Uur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1">
              {hourlyChartData.map((hour, index) => {
                const change = hour.change;
                const isUp = change !== null && change >= 0;
                const hasChange = change !== null;
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded flex flex-col items-center justify-center text-xs font-medium transition-colors ${
                      hasChange 
                        ? isUp ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    title={`${hour.hour}: ${hour.views} nu, ${hour.prevViews} vorige periode${hasChange ? ` (${isUp ? '+' : ''}${change}%)` : ''}`}
                  >
                    <span className="font-bold">{index}u</span>
                    {hasChange && (
                      <span className="text-[10px]">{isUp ? '+' : ''}{change}%</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span className="text-red-500">↓ Daling</span>
              <span>vs vorige periode</span>
              <span className="text-green-500">↑ Stijging</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dagelijkse Trend (laatste {Math.min(days, 30)} dagen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(), 
                    name === 'views' ? 'Views' : name === 'facebook' ? 'Via Facebook' : 'Sessies'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="facebook" 
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
