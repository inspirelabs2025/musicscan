import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, TrendingUp, Music, Disc, MessageSquare, Clock, Star,
  BarChart3, Search, Sparkles, Users, Newspaper, Shield,
  Loader2, Play, Trophy, ShoppingBag, Target, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCollectionStats } from '@/hooks/useCollectionStats';
import { useDirectScans } from '@/hooks/useDirectScans';
import { useUnifiedAlbums } from '@/hooks/useUnifiedAlbums';
import { useUnifiedScansStats } from '@/hooks/useUnifiedScansStats';
import { useUserStats } from '@/hooks/useUserStats';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLanguage } from '@/contexts/LanguageContext';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { ChatWidget } from '@/components/dashboard/ChatWidget';
import { QuizWidget } from '@/components/dashboard/QuizWidget';
import { SpotifyWidget } from '@/components/dashboard/SpotifyWidget';
import { EchoWidget } from '@/components/dashboard/EchoWidget';
import { UnifiedContentWidget } from '@/components/dashboard/UnifiedContentWidget';
import { BatchBlogGenerator } from '@/components/admin/BatchBlogGenerator';
import { LatestAlbumsSection } from '@/components/LatestAlbumsSection';
import { AlbumOfTheDay } from '@/components/dashboard/AlbumOfTheDay';
import { CollectionPersonality } from '@/components/dashboard/CollectionPersonality';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { MusicStoryWidget } from '@/components/dashboard/MusicStoryWidget';
import { CreditsDisplay } from '@/components/credits/CreditsDisplay';
import { useDashboardActivity } from '@/hooks/useDashboardActivity';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { tr: t } = useLanguage();
  const ADMIN_EMAIL = 'rogiervisser76@gmail.com';
  const { data: collectionStats, isLoading: collectionLoading } = useCollectionStats();
  const { data: recentScans, isLoading: scansLoading } = useDirectScans();
  const { data: unifiedAlbums, isLoading: albumsLoading } = useUnifiedAlbums();
  const { data: scanStats, isLoading: statsLoading } = useUnifiedScansStats();
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const subscription = useSubscriptionContext();
  const { data: dashboardActivities, isLoading: activitiesLoading } = useDashboardActivity();
  const { 
    isOnboardingOpen, setIsOnboardingOpen, shouldShowOnboarding, 
    currentStepIndex, currentStepData, totalSteps, nextStep, previousStep,
    completeOnboarding, skipOnboarding, startOnboarding, restartOnboarding 
  } = useOnboarding();

  React.useEffect(() => {
    if (shouldShowOnboarding) {
      const timer = setTimeout(() => { startOnboarding(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, startOnboarding]);

  if (scansLoading || collectionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || '';
  const totalCollection = scanStats?.totalScans || 0;
  const collectionValue = collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0;
  const successRate = scanStats?.successRate || 0;

  return (
    <>
      <OnboardingModal 
        isOnboardingOpen={isOnboardingOpen} setIsOnboardingOpen={setIsOnboardingOpen}
        currentStepIndex={currentStepIndex} currentStepData={currentStepData}
        totalSteps={totalSteps} nextStep={nextStep} previousStep={previousStep}
        completeOnboarding={completeOnboarding} skipOnboarding={skipOnboarding}
      />

      <div className="min-h-screen bg-background">
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem', boxSizing: 'border-box' as const, width: '100%', overflowX: 'hidden' as const }}>

          {/* ── 1. HERO BANNER ── */}
          <section className="rounded-xl bg-gradient-to-r from-[hsl(271,81%,22%)] to-[hsl(271,81%,36%)] text-white" style={{ padding: '1.25rem' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  {t.dashboard.welcomeBack}{firstName ? `, ${firstName}` : ''}
                </h1>
                <p className="text-xs text-white/60 mt-0.5">{t.dashboard.personalExperience}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  <Link to="/ai-scan-v2">
                    <Camera className="w-4 h-4 mr-1.5" />
                    {t.dashboard.scanNow}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Link to="/my-collection">
                    <Search className="w-4 h-4 mr-1.5" />
                    {t.dashboard.myCollection}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {[
                { label: t.dashboard.totalCollection, value: statsLoading ? '…' : String(totalCollection), icon: Disc },
                { label: t.dashboard.collectionValue, value: collectionLoading ? '…' : `€${collectionValue}`, icon: TrendingUp },
                { label: t.dashboard.thisMonth, value: statsLoading ? '…' : String(totalCollection), icon: Camera },
                { label: t.dashboard.successRate, value: statsLoading ? '…' : `${successRate.toFixed(1)}%`, icon: Star },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                  <stat.icon className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight">{stat.value}</div>
                    <div className="text-[10px] text-white/50 truncate">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 2. MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

            {/* ── Main Column (2/3) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Magic Mike */}
              <EchoWidget />

              {/* Chat met je Muziek */}
              <ChatWidget />

              {/* Collectie Quiz Challenge */}
              <QuizWidget />

              {/* Muziek Inzichten */}
              <MusicStoryWidget />

              {/* Album van de Dag + Collectie Persoonlijkheid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AlbumOfTheDay albums={unifiedAlbums || []} />
                <CollectionPersonality
                  genres={collectionStats?.genres || []}
                  totalItems={collectionStats?.totalItems || 0}
                  totalValue={collectionStats?.totalValue || 0}
                />
              </div>
            </div>

            {/* ── Sidebar (1/3) ── */}
            <div className="space-y-6">

              {/* Scan Credits */}
              <CreditsDisplay />

              {/* Abonnement Status */}
              <SubscriptionStatus />

              {/* Spotify */}
              <SpotifyWidget />

              {/* Recente Activiteit */}
              <Card>
                <CardHeader className="pb-2" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {t.dashboard.recentActivity}
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 animate-pulse">
                          <div className="w-6 h-6 bg-muted rounded shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2.5 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dashboardActivities && dashboardActivities.length > 0 ? (
                    <div className="space-y-0">
                      {dashboardActivities.slice(0, 6).map((a) => (
                        <div key={`${a.type}-${a.id}`} className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0">
                          <span className="text-sm shrink-0">{a.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{a.description}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                            {new Date(a.timestamp).toLocaleDateString(t.common?.locale === 'en' ? 'en-US' : 'nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Music className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{t.dashboard.noScansYet}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Je Muziekstijl */}
              {collectionStats && (collectionStats.genres?.length > 0 || collectionStats.artists?.length > 0) && (
                <Card>
                  <CardHeader className="pb-2" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Music className="w-3.5 h-3.5" />
                      {t.dashboard.yourMusicStyle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                    <div className="space-y-1.5">
                      {collectionStats.genres?.slice(0, 5).map((g) => {
                        const maxCount = collectionStats.genres?.[0]?.count || 1;
                        const pct = Math.round((g.count / maxCount) * 100);
                        return (
                          <div key={g.genre} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium truncate mr-2">{g.genre}</span>
                              <span className="text-muted-foreground shrink-0">{g.count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {collectionStats.artists && collectionStats.artists.length > 0 && (
                      <div className="border-t border-border/40 mt-3 pt-3 space-y-1">
                        {collectionStats.artists.slice(0, 4).map((a) => (
                          <div key={a.artist} className="flex justify-between text-xs py-0.5">
                            <span className="truncate mr-2">{a.artist}</span>
                            <span className="text-muted-foreground shrink-0">{a.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Insights (sidebar) */}
              <AIInsightsWidget />
            </div>
          </div>

          {/* ── 3. FULL-WIDTH SECTIONS ── */}
          <div className="mt-6 space-y-6">

            {/* Ontdek & Leer */}
            <UnifiedContentWidget />

            {/* Nieuwste Uploads */}
            <LatestAlbumsSection />

            {/* Quick Nav */}
            <Card>
              <CardContent style={{ padding: '1.25rem' }}>
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

            {/* Admin Tools */}
            {user?.email === ADMIN_EMAIL && (
              <Card>
                <CardHeader className="pb-2" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    Admin Tools
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/super-admin"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />SuperAdmin</Link>
                    </Button>
                    <BatchBlogGenerator />
                    <Button onClick={restartOnboarding} variant="outline" size="sm">
                      <Play className="h-3.5 w-3.5 mr-1.5" />Test Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
