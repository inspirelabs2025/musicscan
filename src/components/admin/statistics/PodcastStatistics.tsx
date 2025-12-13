import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Headphones, Podcast, Play, Clock, TrendingUp, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PodcastStatisticsProps {
  days: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function PodcastStatistics({ days }: PodcastStatisticsProps) {
  const startDate = subDays(new Date(), days).toISOString();

  // Fetch own podcasts stats
  const { data: ownPodcasts, isLoading: loadingOwn } = useQuery({
    queryKey: ['podcast-stats-own', days],
    queryFn: async () => {
      const { data: podcasts, error: podcastError } = await supabase
        .from('own_podcasts')
        .select('id, name, is_published');
      
      if (podcastError) throw podcastError;

      const { data: episodes, error: episodeError } = await supabase
        .from('own_podcast_episodes')
        .select('id, podcast_id, title, views_count, audio_duration_seconds, is_published, created_at');
      
      if (episodeError) throw episodeError;

      const totalPodcasts = podcasts?.length || 0;
      const publishedPodcasts = podcasts?.filter(p => p.is_published).length || 0;
      const totalEpisodes = episodes?.length || 0;
      const publishedEpisodes = episodes?.filter(e => e.is_published).length || 0;
      const totalViews = episodes?.reduce((sum, e) => sum + (e.views_count || 0), 0) || 0;
      const totalDuration = episodes?.reduce((sum, e) => sum + (e.audio_duration_seconds || 0), 0) || 0;

      // Episodes per podcast for chart
      const episodesPerPodcast = podcasts?.map(p => ({
        name: p.name?.substring(0, 20) || 'Onbekend',
        episodes: episodes?.filter(e => e.podcast_id === p.id).length || 0,
        views: episodes?.filter(e => e.podcast_id === p.id).reduce((sum, e) => sum + (e.views_count || 0), 0) || 0
      })) || [];

      // Recent episodes (within period)
      const recentEpisodes = episodes?.filter(e => 
        new Date(e.created_at) >= new Date(startDate)
      ).length || 0;

      return {
        totalPodcasts,
        publishedPodcasts,
        totalEpisodes,
        publishedEpisodes,
        totalViews,
        totalDuration,
        episodesPerPodcast,
        recentEpisodes
      };
    },
    staleTime: 60 * 1000
  });

  // Fetch top episodes by views
  const { data: topEpisodes, isLoading: loadingTop } = useQuery({
    queryKey: ['podcast-top-episodes', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .select('id, title, views_count, podcast_id, own_podcasts(name)')
        .eq('is_published', true)
        .order('views_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data?.map(e => ({
        title: e.title?.substring(0, 30) || 'Onbekend',
        views: e.views_count || 0,
        podcast: (e.own_podcasts as any)?.name || 'Onbekend'
      })) || [];
    },
    staleTime: 60 * 1000
  });

  const isLoading = loadingOwn || loadingTop;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}u ${minutes}m`;
    return `${minutes}m`;
  };

  const stats = [
    {
      label: 'Podcasts',
      value: ownPodcasts?.totalPodcasts || 0,
      subValue: `${ownPodcasts?.publishedPodcasts || 0} gepubliceerd`,
      icon: Podcast,
      color: 'text-primary'
    },
    {
      label: 'Afleveringen',
      value: ownPodcasts?.totalEpisodes || 0,
      subValue: `${ownPodcasts?.recentEpisodes || 0} nieuw (${days}d)`,
      icon: Headphones,
      color: 'text-chart-2'
    },
    {
      label: 'Totaal Weergaven',
      value: ownPodcasts?.totalViews?.toLocaleString() || 0,
      subValue: 'Alle afleveringen',
      icon: Eye,
      color: 'text-chart-3'
    },
    {
      label: 'Totale Speelduur',
      value: formatDuration(ownPodcasts?.totalDuration || 0),
      subValue: 'Alle content',
      icon: Clock,
      color: 'text-chart-4'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Episodes per Podcast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Podcast className="h-5 w-5" />
              Afleveringen per Podcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ownPodcasts?.episodesPerPodcast && ownPodcasts.episodesPerPodcast.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ownPodcasts.episodesPerPodcast}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [`${value} afleveringen`, 'Aantal']}
                  />
                  <Bar dataKey="episodes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Geen podcasts gevonden</p>
            )}
          </CardContent>
        </Card>

        {/* Top Episodes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 5 Afleveringen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topEpisodes && topEpisodes.length > 0 ? (
              <div className="space-y-3">
                {topEpisodes.map((episode, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{episode.title}</p>
                        <p className="text-xs text-muted-foreground">{episode.podcast}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {episode.views.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Geen afleveringen gevonden</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Views per Podcast Pie Chart */}
      {ownPodcasts?.episodesPerPodcast && ownPodcasts.episodesPerPodcast.some(p => p.views > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5" />
              Weergaven Verdeling per Podcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ownPodcasts.episodesPerPodcast.filter(p => p.views > 0)}
                    dataKey="views"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {ownPodcasts.episodesPerPodcast.filter(p => p.views > 0).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} weergaven`, 'Weergaven']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
