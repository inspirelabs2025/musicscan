import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, TrendingUp, Music, Disc, MessageSquare, Zap, Clock, Star,
  BarChart3, Search, Sparkles, Users, Newspaper, Shield,
  Loader2, Play, Trophy, ShoppingBag, Target
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
import { NewUsersSection } from '@/components/NewUsersSection';
import { IntegratedAchievementSystem } from '@/components/dashboard/IntegratedAchievementSystem';
import { AlbumOfTheDay } from '@/components/dashboard/AlbumOfTheDay';
import { CollectionPersonality } from '@/components/dashboard/CollectionPersonality';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { NextGoalWidget } from '@/components/dashboard/NextGoalWidget';
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

  const latestScans = recentScans?.slice(0, 5) || [];

  if (scansLoading || collectionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        <div
          className="relative mx-auto"
          style={{ maxWidth: '1100px', padding: '32px 20px 48px', width: '100%', boxSizing: 'border-box' }}
        >
          {/* Welcome Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-foreground">
              {t.dashboard.welcomeBack}
            </h1>
            <p className="text-muted-foreground mt-2">{t.dashboard.personalExperience}</p>
          </div>

          {/* Quick Actions */}
          <section className="mb-10">
            <div
              className="rounded-xl p-5 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 50%))' }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(45 100% 60%)' }}>
                <Zap className="w-4 h-4" style={{ color: 'hsl(45 100% 60%)' }} />
                {t.dashboard.quickActions}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Link to="/ai-scan-v2" className="flex flex-col items-center justify-center gap-2 h-20 rounded-lg font-bold text-sm transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(45 100% 50%))', color: 'black' }}>
                  <Camera className="w-5 h-5" />
                  <span>{t.dashboard.scanNow}</span>
                </Link>
                <Link to="/my-collection" className="flex flex-col items-center justify-center gap-2 h-20 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  <Search className="w-5 h-5" />
                  <span>{t.dashboard.myCollection}</span>
                </Link>
                <button onClick={() => window.dispatchEvent(new Event('open-magic-mike'))} className="flex flex-col items-center justify-center gap-2 h-20 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] cursor-pointer" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  <MessageSquare className="w-5 h-5" />
                  <span>{t.dashboard.chat}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Stats Cards */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {t.dashboard.yourMusicDNA}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t.dashboard.totalCollection} value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.albumsDiscovered} icon={Disc} />
              <StatCard title={t.dashboard.collectionValue} value={collectionLoading ? "..." : `€${collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0}`} subtitle={t.dashboard.estimatedTotal} icon={TrendingUp} />
              <StatCard title={t.dashboard.thisMonth} value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.newScans} icon={Camera} />
              <StatCard title={t.dashboard.successRate} value={statsLoading ? "..." : `${(scanStats?.successRate || 0).toFixed(1)}%`} subtitle={t.dashboard.successfulScans} icon={Star} />
            </div>
          </section>

          {/* Credits & Subscription */}
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CreditsDisplay />
              <SubscriptionStatus />
            </div>
          </section>

          {/* Command Center - 3 + 2 layout */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t.dashboard.commandCenter}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <EchoWidget />
              <AIInsightsWidget />
              <ChatWidget />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuizWidget />
              <SpotifyWidget />
            </div>
          </section>

          {/* Fun & Interactive */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Disc className="w-5 h-5 text-primary" />
              {t.dashboard.musicFun}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AlbumOfTheDay albums={unifiedAlbums || []} />
              <MusicStoryWidget />
              <CollectionPersonality genres={collectionStats?.genres || []} totalItems={collectionStats?.totalItems || 0} totalValue={collectionStats?.totalValue || 0} />
            </div>
          </section>

          {/* Content & Activity */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              {t.dashboard.discoverLearn}
            </h2>
            <div className="space-y-4">
              <UnifiedContentWidget />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {t.dashboard.recentActivity}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 animate-pulse">
                          <div className="w-10 h-10 bg-muted rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dashboardActivities && dashboardActivities.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardActivities.map((activity) => (
                        <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg shrink-0">
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.description}</p>
                            {activity.details && <p className="text-xs text-muted-foreground truncate">{activity.details}</p>}
                            <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString(t.common?.locale === 'en' ? 'en-US' : 'nl-NL')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Music className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.dashboard.noScansYet}</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link to="/scanner"><Camera className="w-4 h-4 mr-2" />{t.dashboard.startScanning}</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Latest Albums - constrained */}
          <section className="mb-10">
            <LatestAlbumsSection />
          </section>

          {/* Quick Navigation */}
          <section className="mb-10">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t.dashboard.quickNavigation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/collection-overview"><TrendingUp className="w-4 h-4" />{t.dashboard.overview}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/collection-chat"><MessageSquare className="w-4 h-4" />{t.dashboard.chat}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/my-shop"><Star className="w-4 h-4" />{t.dashboard.myShop}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/unified-scan-overview"><BarChart3 className="w-4 h-4" />{t.dashboard.allScans}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/quizzen"><Trophy className="w-4 h-4" />{t.dashboard.quizzes}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/mijn-quizzen"><Target className="w-4 h-4" />{t.dashboard.scores}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/artists"><Users className="w-4 h-4" />{t.nav.artists}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-14 flex flex-col gap-1 text-xs">
                    <Link to="/shop"><ShoppingBag className="w-4 h-4" />{t.nav.shop}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Music Style */}
          {collectionStats && !collectionLoading && (
            <section className="mb-10">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    {t.dashboard.yourMusicStyle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">{t.dashboard.topGenres}</h4>
                      <div className="space-y-1.5">
                        {collectionStats.genres?.slice(0, 3).map((genre) => (
                          <div key={genre.genre} className="flex justify-between items-center">
                            <span className="text-sm">{genre.genre}</span>
                            <span className="text-xs text-muted-foreground">{genre.count} {t.common.albums}</span>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">{t.dashboard.noGenresYet}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">{t.dashboard.topArtists}</h4>
                      <div className="space-y-1.5">
                        {collectionStats.artists?.slice(0, 3).map((artist) => (
                          <div key={artist.artist} className="flex justify-between items-center">
                            <span className="text-sm">{artist.artist}</span>
                            <span className="text-xs text-muted-foreground">{artist.count} {t.common.albums}</span>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">{t.dashboard.noArtistsYet}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Admin Tools */}
          {user?.email === ADMIN_EMAIL && (
            <section className="mb-10">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Shield className="h-4 w-4" />
                    Admin Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild variant="outline" size="sm" className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                      <Link to="/super-admin" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />SuperAdmin Dashboard</Link>
                    </Button>
                    <BatchBlogGenerator />
                    <Button onClick={restartOnboarding} variant="outline" size="sm" className="border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20">
                      <Play className="h-4 w-4 mr-2" />Test Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
