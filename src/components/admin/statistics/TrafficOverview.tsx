import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsOverview } from '@/hooks/useDetailedAnalytics';
import { Eye, Users, Facebook, Search, MousePointer, UserX } from 'lucide-react';

interface TrafficOverviewProps {
  days: number;
}

export function TrafficOverview({ days }: TrafficOverviewProps) {
  const { data, isLoading } = useAnalyticsOverview(days);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array(7).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { 
      label: 'Totaal Views', 
      value: data?.total_views || 0, 
      icon: Eye, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Unieke Sessies', 
      value: data?.unique_sessions || 0, 
      icon: Users, 
      color: 'text-green-500' 
    },
    { 
      label: 'Admin Views', 
      value: data?.admin_views || 0, 
      icon: UserX, 
      color: 'text-red-500',
      subtitle: 'uitgesloten'
    },
    { 
      label: 'Via Facebook', 
      value: data?.facebook_views || 0, 
      icon: Facebook, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Via Google', 
      value: data?.google_views || 0, 
      icon: Search, 
      color: 'text-yellow-500' 
    },
    { 
      label: 'Direct', 
      value: data?.direct_views || 0, 
      icon: MousePointer, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Gem./Dag', 
      value: data?.avg_views_per_day?.toFixed(1) || '0', 
      icon: Eye, 
      color: 'text-cyan-500' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
