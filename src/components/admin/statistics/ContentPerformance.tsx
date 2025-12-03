import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentCategories } from '@/hooks/useDetailedAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ContentPerformanceProps {
  days: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(180, 70%, 50%)',
  'hsl(140, 70%, 50%)',
  'hsl(100, 70%, 50%)',
  'hsl(60, 70%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(0, 70%, 50%)',
  'hsl(270, 70%, 50%)',
  'hsl(300, 70%, 50%)',
  'hsl(330, 70%, 50%)',
  'hsl(210, 40%, 50%)',
];

export function ContentPerformance({ days }: ContentPerformanceProps) {
  const { data, isLoading } = useContentCategories(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Performance per Categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map((cat) => ({
    name: cat.category,
    views: Number(cat.view_count),
    sessions: Number(cat.unique_sessions),
  })) || [];

  const totalViews = chartData.reduce((sum, cat) => sum + cat.views, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Performance per Categorie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toLocaleString(), 
                  name === 'views' ? 'Views' : 'Sessies'
                ]}
              />
              <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {chartData.slice(0, 8).map((cat, index) => (
            <div key={cat.name} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <p className="text-2xl font-bold">{cat.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {totalViews > 0 ? ((cat.views / totalViews) * 100).toFixed(1) : 0}% van totaal
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
