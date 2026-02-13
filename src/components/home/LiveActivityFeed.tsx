import { useLatestActivity } from '@/hooks/useLatestActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { TrendingUp, Users, MessageSquare, Disc3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const LiveActivityFeed = () => {
  const { data: activities, isLoading } = useLatestActivity();

  const { data: stats } = useQuery({
    queryKey: ['live-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [cdScansResult, vinylScansResult, topicsResult, storiesResult] = await Promise.all([
        supabase
          .from('cd_scan')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('vinyl2_scan')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('forum_topics')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('music_stories')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
      ]);

      return {
        scansToday: (cdScansResult.count || 0) + (vinylScansResult.count || 0),
        activeTopics: topicsResult.count || 0,
        totalStories: storiesResult.count || 0
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Activity Feed */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card-purple/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
            Live Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors animate-fade-in"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true,
                        locale: nl 
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Geen recente activiteit
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Widget */}
      <Card className="border-vinyl-gold/20 bg-gradient-to-br from-card to-vinyl-gold/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-vinyl-gold" />
            Live Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Disc3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scans Vandaag</p>
                  <p className="text-2xl font-bold">{stats?.scansToday || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-vinyl-gold/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-vinyl-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actieve Discussies</p>
                  <p className="text-2xl font-bold">{stats?.activeTopics || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totaal Verhalen</p>
                  <p className="text-2xl font-bold">{stats?.totalStories || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
