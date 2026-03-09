import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Search, Disc, TrendingUp, Star, Clock, Music,
  MessageSquare, Trophy, Sparkles, BarChart3, Users,
  Newspaper, ShoppingBag, Target, Shield, Play, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCollectionStats } from '@/hooks/useCollectionStats';
import { useDirectScans } from '@/hooks/useDirectScans';
import { useUnifiedAlbums } from '@/hooks/useUnifiedAlbums';
import { useUnifiedScansStats } from '@/hooks/useUnifiedScansStats';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { ChatWidget } from '@/components/dashboard/ChatWidget';
import { QuizWidget } from '@/components/dashboard/QuizWidget';
import { SpotifyWidget } from '@/components/dashboard/SpotifyWidget';
import { EchoWidget } from '@/components/dashboard/EchoWidget';
import { UnifiedContentWidget } from '@/components/dashboard/UnifiedContentWidget';
import { LatestAlbumsSection } from '@/components/LatestAlbumsSection';
import { AlbumOfTheDay } from '@/components/dashboard/AlbumOfTheDay';
import { CollectionPersonality } from '@/components/dashboard/CollectionPersonality';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { MusicStoryWidget } from '@/components/dashboard/MusicStoryWidget';
import { CreditsDisplay } from '@/components/credits/CreditsDisplay';
import { useDashboardActivity } from '@/hooks/useDashboardActivity';
import { Loader2 } from 'lucide-react';

const Dashboard2 = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { tr: t } = useLanguage();
  const { data: collectionStats, isLoading: collectionLoading } = useCollectionStats();
  const { data: recentScans, isLoading: scansLoading } = useDirectScans();
  const { data: unifiedAlbums, isLoading: albumsLoading } = useUnifiedAlbums();
  const { data: scanStats, isLoading: statsLoading } = useUnifiedScansStats();
  const subscription = useSubscriptionContext();
  const { data: dashboardActivities, isLoading: activitiesLoading } = useDashboardActivity();

  if (scansLoading || collectionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || '';
  const totalCollection = scanStats?.totalScans || 0;
  const collectionValue = collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0;
  const successRate = scanStats?.successRate || 0;

  const statItems = [
    { label: t.dashboard.totalCollection, value: statsLoading ? '…' : String(totalCollection), icon: Disc },
    { label: t.dashboard.collectionValue, value: collectionLoading ? '…' : `€${collectionValue}`, icon: TrendingUp },
    { label: t.dashboard.thisMonth, value: statsLoading ? '…' : String(totalCollection), icon: Camera },
    { label: t.dashboard.successRate, value: statsLoading ? '…' : `${successRate.toFixed(1)}%`, icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">

        {/* ── HERO ── */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {t.dashboard.welcomeBack}{firstName ? `, ${firstName}` : ''}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{t.dashboard.personalExperience}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link to="/ai-scan-v2">
                    <Camera className="w-4 h-4 mr-1.5" />
                    {t.dashboard.scanNow}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/my-collection">
                    <Search className="w-4 h-4 mr-1.5" />
                    {t.dashboard.myCollection}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border divide-x divide-border">
            {statItems.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-base font-bold text-foreground leading-tight">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Smart Tools 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EchoWidget />
              <ChatWidget />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuizWidget />
              <AIInsightsWidget />
            </div>

            {/* Music Story */}
            <MusicStoryWidget />

            {/* Album + Personality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AlbumOfTheDay albums={unifiedAlbums || []} />
              <CollectionPersonality
                genres={collectionStats?.genres || []}
                totalItems={collectionStats?.totalItems || 0}
                totalValue={collectionStats?.totalValue || 0}
              />
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-6">

            <CreditsDisplay />
            <SubscriptionStatus />
            <SpotifyWidget />

            {/* Recente Activiteit */}
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {t.dashboard.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-7 h-7 bg-muted rounded-lg shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-muted rounded w-4/5" />
                          <div className="h-2.5 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dashboardActivities && dashboardActivities.length > 0 ? (
                  <div className="space-y-1">
                    {dashboardActivities.slice(0, 6).map((a) => (
                      <div key={`${a.type}-${a.id}`} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                        <span className="text-sm shrink-0 w-6 text-center">{a.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{a.description}</p>
                          {a.details && <p className="text-[11px] text-muted-foreground truncate">{a.details}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(a.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Music className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{t.dashboard.noScansYet}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Muziekstijl */}
            {collectionStats && collectionStats.genres?.length > 0 && (
              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    {t.dashboard.yourMusicStyle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="space-y-2.5">
                    {collectionStats.genres.slice(0, 5).map((g) => {
                      const maxCount = collectionStats.genres?.[0]?.count || 1;
                      const pct = Math.round((g.count / maxCount) * 100);
                      return (
                        <div key={g.genre}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground truncate mr-2">{g.genre}</span>
                            <span className="text-muted-foreground shrink-0">{g.count}</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {collectionStats.artists && collectionStats.artists.length > 0 && (
                    <div className="border-t border-border mt-4 pt-3 space-y-1.5">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Top Artiesten</p>
                      {collectionStats.artists.slice(0, 4).map((a) => (
                        <div key={a.artist} className="flex justify-between text-xs py-0.5">
                          <span className="text-foreground truncate mr-2">{a.artist}</span>
                          <span className="text-muted-foreground shrink-0">{a.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── FULL-WIDTH BOTTOM ── */}
        <div className="mt-8 space-y-6">
          <UnifiedContentWidget />
          <LatestAlbumsSection />

          {/* Quick Nav */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { to: '/collection-overview', icon: TrendingUp, label: t.dashboard.overview },
                  { to: '/collection-chat', icon: MessageSquare, label: t.dashboard.chat },
                  { to: '/my-shop', icon: Star, label: t.dashboard.myShop },
                  { to: '/unified-scan-overview', icon: BarChart3, label: t.dashboard.allScans },
                  { to: '/quizzen', icon: Trophy, label: t.dashboard.quizzes },
                  { to: '/mijn-quizzen', icon: Target, label: t.dashboard.scores },
                  { to: '/artists', icon: Users, label: t.nav.artists },
                  { to: '/shop', icon: ShoppingBag, label: t.nav.shop },
                  { to: '/nieuws', icon: Newspaper, label: 'Nieuws' },
                ].map(({ to, icon: Icon, label }) => (
                  <Button key={to} asChild variant="outline" size="sm" className="h-8 text-xs">
                    <Link to={to}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard2;
