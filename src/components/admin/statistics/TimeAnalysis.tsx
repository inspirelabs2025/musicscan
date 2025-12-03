import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHourlyTraffic, useDailyTraffic } from '@/hooks/useDetailedAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TimeAnalysisProps {
  days: number;
}

export function TimeAnalysis({ days }: TimeAnalysisProps) {
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyTraffic(days);
  const { data: dailyData, isLoading: dailyLoading } = useDailyTraffic(Math.min(days, 30));

  if (hourlyLoading || dailyLoading) {
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

  // Prepare hourly data with all 24 hours
  const hourlyChartData = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyData?.find(h => h.hour_of_day === hour);
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      views: found ? Number(found.view_count) : 0,
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
                    formatter={(value: number) => [value.toLocaleString(), 'Views']}
                    labelFormatter={(label) => `Tijd: ${label}`}
                  />
                  <Bar 
                    dataKey="views" 
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
            <CardTitle>Traffic Heatmap per Uur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1">
              {hourlyChartData.map((hour, index) => {
                const maxViews = Math.max(...hourlyChartData.map(h => h.views));
                const intensity = maxViews > 0 ? hour.views / maxViews : 0;
                return (
                  <div
                    key={index}
                    className="aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${0.1 + intensity * 0.9})`,
                      color: intensity > 0.5 ? 'white' : 'hsl(var(--foreground))',
                    }}
                    title={`${hour.hour}: ${hour.views} views`}
                  >
                    {index}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Laag traffic</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                  />
                ))}
              </div>
              <span>Hoog traffic</span>
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
