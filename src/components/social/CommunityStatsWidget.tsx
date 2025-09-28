import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Users, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';

export const CommunityStatsWidget = () => {
  const { data: userStats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Totale Community"
        value={userStats?.totalUsers || 0}
        subtitle="Actieve verzamelaars"
        icon={Users}
      />
      <StatCard
        title="Nieuwe Leden"
        value={userStats?.totalUsers || 0}
        subtitle="Nieuwe leden"
        icon={TrendingUp}
      />
      <StatCard
        title="Actieve Gesprekken"
        value="12"
        subtitle="Vandaag gestart"
        icon={MessageSquare}
      />
      <StatCard
        title="Community Love"
        value="2.3k"
        subtitle="Likes deze week"
        icon={Heart}
      />
    </div>
  );
};