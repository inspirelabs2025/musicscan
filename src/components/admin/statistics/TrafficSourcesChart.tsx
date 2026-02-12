import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrafficSources } from '@/hooks/useDetailedAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TrafficSourcesChartProps {
  days: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#6b7280'];

export function TrafficSourcesChart({ days }: TrafficSourcesChartProps) {
  const { data, isLoading } = useTrafficSources(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Bronnen</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map((source, index) => ({
    name: source.source_name,
    value: Number(source.view_count),
    percentage: source.percentage,
    fill: COLORS[index % COLORS.length],
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Bronnen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }: any) => `${name} ${percentage}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Views']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data?.map((source, index) => (
            <div key={source.source_name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{source.source_name}</span>
              </div>
              <div className="flex gap-4 text-muted-foreground">
                <span>{Number(source.view_count).toLocaleString()} views</span>
                <span>{source.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
