import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFacebookPostStats } from '@/hooks/useDetailedAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Facebook, FileText, Newspaper, Music, Youtube, ShoppingBag, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const CONTENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  blog_post: { label: 'Blog Posts', color: '#8b5cf6', icon: FileText },
  news: { label: 'Nieuws', color: '#3b82f6', icon: Newspaper },
  music_history: { label: 'Muziek Geschiedenis', color: '#22c55e', icon: Music },
  youtube: { label: 'YouTube', color: '#ef4444', icon: Youtube },
  product: { label: 'Producten', color: '#eab308', icon: ShoppingBag },
  anecdote: { label: 'Anekdotes', color: '#ec4899', icon: BookOpen },
  single: { label: 'Singles', color: '#06b6d4', icon: Music },
};

export function FacebookPerformance() {
  const { data, isLoading } = useFacebookPostStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Post Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data?.byType || {})
    .map(([type, count]) => ({
      name: CONTENT_TYPE_CONFIG[type]?.label || type,
      value: count,
      fill: CONTENT_TYPE_CONFIG[type]?.color || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Totaal Posts</span>
            </div>
            <p className="text-3xl font-bold">{data?.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        {chartData.slice(0, 3).map((item) => {
          const config = Object.values(CONTENT_TYPE_CONFIG).find(c => c.label === item.name);
          const Icon = config?.icon || FileText;
          return (
            <Card key={item.name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="h-4 w-4" style={{ color: item.fill }} />
                  <span className="text-xs">{item.name}</span>
                </div>
                <p className="text-3xl font-bold">{item.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts per Content Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Posts']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recente Facebook Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.recentPosts.map((post: any, index: number) => {
              const config = CONTENT_TYPE_CONFIG[post.content_type] || { label: post.content_type, color: '#6b7280', icon: FileText };
              const Icon = config.icon;
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(post.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
