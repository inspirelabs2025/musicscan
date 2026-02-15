import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, TrendingUp, Music, Disc, MessageSquare, Zap, Clock, Star,
  BarChart3, Upload, Search, Shuffle, Sparkles, Users, Newspaper, Shield,
  Loader2, Play, Trophy, ShoppingBag, BookOpen, Target
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background">
        {/* Musical Background Elements */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 text-4xl animate-pulse">🎵</div>
          <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
          <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-1000">🎼</div>
          <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">🎸</div>
        </div>

        <div className="container mx-auto px-4 py-8 relative">
          {/* Welcome Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-vinyl-purple animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
                {t.dashboard.welcomeBack}
              </h1>
              <Sparkles className="w-8 h-8 text-vinyl-gold animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-lg">{t.dashboard.personalExperience}</p>
          </div>

          {/* Quick Actions Hero */}
          <section className="mb-12 animate-fade-in delay-200">
            <div 
              className="relative overflow-hidden rounded-2xl p-6 shadow-xl"
              style={{ background: 'linear-gradient(135deg, hsl(270 70% 40%), hsl(270 60% 50%), hsl(260 70% 55%))' }}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-3 left-6 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '0.1s' }}>🎵</div>
                <div className="absolute top-5 right-10 text-2xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}>🎶</div>
                <div className="absolute bottom-3 left-1/3 text-xl opacity-20 animate-pulse" style={{ animationDelay: '0.3s' }}>🎸</div>
                <div className="absolute bottom-4 right-1/4 text-2xl opacity-20 animate-bounce" style={{ animationDelay: '0.7s' }}>🥁</div>
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(45 100% 60%), transparent)' }} />
                <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'hsl(45 100% 60%)' }}>
                  <Zap className="w-5 h-5" style={{ color: 'hsl(45 100% 60%)' }} />
                  <span className="font-extrabold tracking-wide">{t.dashboard.quickActions}</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Link to="/ai-scan-v2" className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group" style={{ background: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(45 100% 50%))', color: 'black' }}>
                    <div className="p-2.5 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }}>
                      <Camera className="w-6 h-6 group-hover:animate-pulse" />
                    </div>
                    <span>{t.dashboard.scanNow}</span>
                  </Link>
                  <Link to="/my-collection" className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.03] group" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(4px)' }}>
                    <div className="p-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Search className="w-6 h-6 group-hover:animate-pulse" />
                    </div>
                    <span>{t.dashboard.myCollection}</span>
                  </Link>
                  <button onClick={() => window.dispatchEvent(new Event('open-magic-mike'))} className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.03] group cursor-pointer" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(4px)' }}>
                    <div className="p-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
                    </div>
                    <span>{t.dashboard.chat}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Credits & Subscription */}
          <section className="mb-12 animate-fade-in delay-250 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CreditsDisplay />
            <SubscriptionStatus />
          </section>

          {/* Stats Cards */}
          <section className="mb-12 animate-fade-in delay-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-vinyl-purple" />
              {t.dashboard.yourMusicDNA}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title={t.dashboard.totalCollection} value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.albumsDiscovered} icon={Disc} />
              <StatCard title={t.dashboard.collectionValue} value={collectionLoading ? "..." : `€${collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0}`} subtitle={t.dashboard.estimatedTotal} icon={TrendingUp} />
              <StatCard title={t.dashboard.thisMonth} value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`} subtitle={t.dashboard.newScans} icon={Camera} />
              <StatCard title={t.dashboard.successRate} value={statsLoading ? "..." : `${(scanStats?.successRate || 0).toFixed(1)}%`} subtitle={t.dashboard.successfulScans} icon={Star} />
            </div>
          </section>

          {/* AI & Interactive Widgets Section */}
          <section className="mb-12 animate-fade-in delay-400">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-vinyl-purple" />
              {t.dashboard.commandCenter}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <EchoWidget />
              <AIInsightsWidget />
              <ChatWidget />
              <QuizWidget />
              <SpotifyWidget />
            </div>
          </section>

          {/* Next Goal Widget */}
          <section className="mb-12 animate-fade-in delay-450">
            <NextGoalWidget totalItems={collectionStats?.totalItems || 0} totalValue={collectionStats?.totalValue || 0} totalScans={scanStats?.totalScans || 0} />
          </section>

          {/* Fun & Interactive Section */}
          <section className="mb-12 animate-fade-in delay-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Disc className="w-6 h-6 text-vinyl-purple" />
              {t.dashboard.musicFun}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AlbumOfTheDay albums={unifiedAlbums || []} />
              <MusicStoryWidget />
              <CollectionPersonality genres={collectionStats?.genres || []} totalItems={collectionStats?.totalItems || 0} totalValue={collectionStats?.totalValue || 0} />
            </div>
          </section>

          {/* Content & Community Section */}
          <section className="mb-12 animate-fade-in delay-600">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-vinyl-gold" />
              {t.dashboard.discoverLearn}
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <UnifiedContentWidget />
              <Card className="border-2 hover:border-accent/50 transition-all duration-300 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    {t.dashboard.recentActivity}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scansLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 animate-pulse">
                          <div className="w-12 h-12 bg-muted rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : latestScans.length > 0 ? (
                    <div className="space-y-4">
                      {latestScans.map((scan) => (
                        <div key={scan.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                          <div className="w-12 h-12 bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20 rounded-lg flex items-center justify-center">
                            {scan.media_type === 'vinyl' ? <Disc className="w-6 h-6 text-vinyl-purple" /> : <Music className="w-6 h-6 text-vinyl-gold" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{scan.artist}</p>
                            <p className="text-sm text-muted-foreground truncate">{scan.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleDateString('nl-NL')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">{t.dashboard.noScansYet}</p>
                      <Button asChild className="mt-3">
                        <Link to="/scanner"><Camera className="w-4 h-4 mr-2" />{t.dashboard.startScanning}</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <LatestAlbumsSection />

          {/* Navigation Shortcuts */}
          <section className="mb-12 animate-fade-in delay-700">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t.dashboard.quickNavigation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-purple/10">
                    <Link to="/collection-overview"><TrendingUp className="w-5 h-5" /><span className="text-xs">{t.dashboard.overview}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-gold/10">
                    <Link to="/collection-chat"><MessageSquare className="w-5 h-5" /><span className="text-xs">💬 {t.dashboard.chat}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-accent/20">
                    <Link to="/my-shop"><Star className="w-5 h-5" /><span className="text-xs">{t.dashboard.myShop}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-secondary/50">
                    <Link to="/unified-scan-overview"><BarChart3 className="w-5 h-5" /><span className="text-xs">{t.dashboard.allScans}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-amber-500/10">
                    <Link to="/quizzen"><Trophy className="w-5 h-5 text-amber-500" /><span className="text-xs">{t.dashboard.quizzes}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-purple-500/10">
                    <Link to="/mijn-quizzen"><Target className="w-5 h-5 text-purple-500" /><span className="text-xs">{t.dashboard.scores}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-cyan-500/10">
                    <Link to="/artists"><Users className="w-5 h-5 text-cyan-500" /><span className="text-xs">🎤 {t.nav.artists}</span></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-pink-500/10">
                    <Link to="/shop"><ShoppingBag className="w-5 h-5 text-pink-500" /><span className="text-xs">🛍️ {t.nav.shop}</span></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Community Highlights */}
          <section className="mb-12 animate-fade-in delay-800">
            <Card className="border-2 hover:border-accent/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  {t.dashboard.musicCommunity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NewUsersSection />
              </CardContent>
            </Card>
          </section>

          {/* Top Genres/Artists Quick Preview */}
          {collectionStats && !collectionLoading && (
            <section className="mt-12 animate-fade-in delay-900">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-vinyl-purple" />
                    {t.dashboard.yourMusicStyle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">{t.dashboard.topGenres}</h4>
                      <div className="space-y-2">
                        {collectionStats.genres?.slice(0, 3).map((genre) => (
                          <div key={genre.genre} className="flex justify-between items-center">
                            <span className="text-sm">{genre.genre}</span>
                            <span className="text-xs text-muted-foreground">{genre.count} {t.common.albums}</span>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">{t.dashboard.noGenresYet}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">{t.dashboard.topArtists}</h4>
                      <div className="space-y-2">
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

          {/* Admin Tools Section */}
          {user?.email === ADMIN_EMAIL && (
            <section className="mt-12 animate-fade-in delay-1000">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Shield className="h-5 w-5" />
                    Admin Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                      <Link to="/super-admin" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />SuperAdmin Dashboard</Link>
                    </Button>
                    <BatchBlogGenerator />
                    <Button onClick={restartOnboarding} variant="outline" className="border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20">
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