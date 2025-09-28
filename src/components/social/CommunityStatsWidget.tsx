import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Users, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';
import { useConversationStats } from '@/hooks/useConversationStats';

export const CommunityStatsWidget = () => {
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const { data: conversationStats, isLoading: conversationStatsLoading } = useConversationStats();

  const isLoading = userStatsLoading || conversationStatsLoading;

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
        value={userStats?.newUsersLast7Days || 0}
        subtitle="Afgelopen 7 dagen"
        icon={TrendingUp}
      />
      <StatCard
        title="Actieve Gesprekken"
        value={conversationStats?.todayCount || 0}
        subtitle="Vandaag gestart"
        icon={MessageSquare}
      />
      <StatCard
        title="Community Love"
        value={conversationStats?.weeklyMessages || 0}
        subtitle="Berichten deze week"
        icon={Heart}
      />
    </div>
  );
};