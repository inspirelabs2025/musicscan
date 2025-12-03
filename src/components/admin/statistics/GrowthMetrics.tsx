import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGrowthMetrics } from '@/hooks/useDetailedAnalytics';
import { Users, FileText, ShoppingBag, Package, Mail, TrendingUp } from 'lucide-react';

export function GrowthMetrics() {
  const { data, isLoading } = useGrowthMetrics();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Geregistreerde Gebruikers',
      value: data?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Gepubliceerde Stories',
      value: data?.totalStories || 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Actieve Producten',
      value: data?.totalProducts || 0,
      icon: ShoppingBag,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Totaal Bestellingen',
      value: data?.totalOrders || 0,
      icon: Package,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Newsletter Subscribers',
      value: data?.totalSubscribers || 0,
      icon: Mail,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-lg ${metric.bgColor} mb-4`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <p className="text-3xl font-bold mb-1">{metric.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Platform Groei Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Content</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Stories</span>
                  <span className="font-medium">{data?.totalStories || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, ((data?.totalStories || 0) / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">E-commerce</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Producten</span>
                  <span className="font-medium">{data?.totalProducts || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, ((data?.totalProducts || 0) / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Conversie</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Bestellingen</span>
                  <span className="font-medium">{data?.totalOrders || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${Math.min(100, ((data?.totalOrders || 0) / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Community</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Gebruikers</span>
                  <span className="font-medium">{data?.totalUsers || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, ((data?.totalUsers || 0) / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
