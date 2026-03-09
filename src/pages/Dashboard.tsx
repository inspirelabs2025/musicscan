import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, TrendingUp, Music, Disc, MessageSquare, Clock, Star,
  BarChart3, Search, Sparkles, Users, Newspaper, Shield,
  Loader2, Play, Trophy, ShoppingBag, Target, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
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

  return (
    <>
      <OnboardingModal 
        isOnboardingOpen={isOnboardingOpen} setIsOnboardingOpen={setIsOnboardingOpen}
        currentStepIndex={currentStepIndex} currentStepData={currentStepData}
        totalSteps={totalSteps} nextStep={nextStep} previousStep={previousStep}
        completeOnboarding={completeOnboarding} skipOnboarding={skipOnboarding}
      />

      <div className="min-h-screen bg-background">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Header ── */}
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t.dashboard.welcomeBack}
            </h1>
            <p className="text-sm text-muted-foreground">{t.dashboard.personalExperience}</p>
          </header>

          {/* ── Quick actions ── */}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/ai-scan-v2">
                <Camera className="w-4 h-4 mr-1.5" />
                {t.dashboard.scanNow}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/my-collection">
                <Search className="w-4 h-4 mr-1.5" />
                {t.dashboard.myCollection}
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.dispatchEvent(new Event('open-magic-mike'))}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Magic Mike
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/quizzen">
                <Trophy className="w-4 h-4 mr-1.5" />
                {t.dashboard.quizzes}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/shop">
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                {t.nav.shop}
              </Link>
            </Button>
          </div>

          {/* ── Stats row ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title={t.dashboard.totalCollection} value={statsLoading ? "…" : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.albumsDiscovered} icon={Disc} />
            <StatCard title={t.dashboard.collectionValue} value={collectionLoading ? "…" : `€${collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0}`} subtitle={t.dashboard.estimatedTotal} icon={TrendingUp} />
            <StatCard title={t.dashboard.thisMonth} value={statsLoading ? "…" : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.newScans} icon={Camera} />
            <StatCard title={t.dashboard.successRate} value={statsLoading ? "…" : `${(scanStats?.successRate || 0).toFixed(1)}%`} subtitle={t.dashboard.successfulScans} icon={Star} />
          </section>

          {/* ── Credits & Subscription ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CreditsDisplay />
            <SubscriptionStatus />
          </section>

          {/* ── Smart Tools (2 + 3 layout) ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t.dashboard.commandCenter}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EchoWidget />
              <ChatWidget />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AIInsightsWidget />
              <QuizWidget />
              <SpotifyWidget />
            </div>
          </section>

          {/* ── Muziek Fun ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Disc className="w-4 h-4 text-primary" />
              {t.dashboard.musicFun}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AlbumOfTheDay albums={unifiedAlbums || []} />
              <MusicStoryWidget />
              <CollectionPersonality
                genres={collectionStats?.genres || []}
                totalItems={collectionStats?.totalItems || 0}
                totalValue={collectionStats?.totalValue || 0}
              />
            </div>
          </section>

          {/* ── Content & Activity ── */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              {t.dashboard.discoverLearn}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* content feed — spans 2 cols */}
              <div className="lg:col-span-2">
                <UnifiedContentWidget />
              </div>

              {/* activity sidebar */}
              <Card className="h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {t.dashboard.recentActivity}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 animate-pulse">
                          <div className="w-8 h-8 bg-muted rounded-md shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2.5 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dashboardActivities && dashboardActivities.length > 0 ? (
                    <div className="space-y-1">
                      {dashboardActivities.slice(0, 8).map((a) => (
                        <div key={`${a.type}-${a.id}`} className="flex items-center gap-2.5 py-1.5 rounded-md hover:bg-muted/40 transition-colors px-1 -mx-1">
                          <span className="text-base shrink-0">{a.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{a.description}</p>
                            {a.details && <p className="text-[11px] text-muted-foreground truncate">{a.details}</p>}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(a.timestamp).toLocaleDateString(t.common?.locale === 'en' ? 'en-US' : 'nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Music className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{t.dashboard.noScansYet}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Latest Albums ── */}
          <section>
            <LatestAlbumsSection />
          </section>

          {/* ── Quick Nav ── */}
          <section>
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
              ].map(({ to, icon: Icon, label }) => (
                <Button key={to} asChild variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-foreground">
                  <Link to={to}>
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </section>

          {/* ── Music Style ── */}
          {collectionStats && !collectionLoading && (collectionStats.genres?.length > 0 || collectionStats.artists?.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Music className="w-3.5 h-3.5" />
                  {t.dashboard.yourMusicStyle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">{t.dashboard.topGenres}</h4>
                    <div className="space-y-1">
                      {collectionStats.genres?.slice(0, 3).map((g) => (
                        <div key={g.genre} className="flex justify-between text-sm">
                          <span>{g.genre}</span>
                          <span className="text-muted-foreground text-xs">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">{t.dashboard.topArtists}</h4>
                    <div className="space-y-1">
                      {collectionStats.artists?.slice(0, 3).map((a) => (
                        <div key={a.artist} className="flex justify-between text-sm">
                          <span className="truncate mr-2">{a.artist}</span>
                          <span className="text-muted-foreground text-xs shrink-0">{a.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Admin ── */}
          {user?.email === ADMIN_EMAIL && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
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
    </>
  );
};

export default Dashboard;
