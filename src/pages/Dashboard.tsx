import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  TrendingUp, 
  Music, 
  Disc, 
  MessageSquare, 
  Zap, 
  Clock, 
  Star,
  BarChart3,
  Upload,
  Search,
  Shuffle,
  Sparkles,
  Users,
  Newspaper,
  Shield,
  Loader2,
  Play,
  Trophy,
  ShoppingBag,
  BookOpen,
  Target
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
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
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

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const ADMIN_EMAIL = 'rogiervisser76@gmail.com';
  const { data: collectionStats, isLoading: collectionLoading } = useCollectionStats();
  const { data: recentScans, isLoading: scansLoading } = useDirectScans();
  const { data: unifiedAlbums, isLoading: albumsLoading } = useUnifiedAlbums();
  const { data: scanStats, isLoading: statsLoading } = useUnifiedScansStats();
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const subscription = useSubscription();
  const { 
    isOnboardingOpen,
    setIsOnboardingOpen,
    shouldShowOnboarding, 
    currentStepIndex,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    startOnboarding, 
    restartOnboarding 
  } = useOnboarding();

  // Auto-start onboarding for new users
  React.useEffect(() => {
    if (shouldShowOnboarding) {
      // Small delay to ensure the dashboard has loaded
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, startOnboarding]);

  // Get recent scans (last 5)
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
        isOnboardingOpen={isOnboardingOpen}
        setIsOnboardingOpen={setIsOnboardingOpen}
        currentStepIndex={currentStepIndex}
        currentStepData={currentStepData}
        totalSteps={totalSteps}
        nextStep={nextStep}
        previousStep={previousStep}
        completeOnboarding={completeOnboarding}
        skipOnboarding={skipOnboarding}
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
                🎵 Welkom terug, Muziekontdekker!
              </h1>
              <Sparkles className="w-8 h-8 text-vinyl-gold animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-lg">
              ✨ Je persoonlijke muziek ervaring wacht op je
            </p>
          </div>

          {/* Quick Actions Hero */}
          <section className="mb-12 animate-fade-in delay-200">
            <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-vinyl-purple" />
                  🚀 Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Collectie Tools */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-medium">🎵 Collectie Tools</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Button asChild size="lg" className="h-16 bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80 hover:shadow-lg group">
                      <Link to="/scanner">
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="w-6 h-6 group-hover:animate-pulse" />
                          <span className="text-xs">📸 Scan Nu</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 bg-gradient-to-r from-blue-500/20 to-violet-500/20 hover:from-blue-500/30 hover:to-violet-500/30 border-blue-500/30 group">
                      <Link to="/ai-scan">
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="w-6 h-6 group-hover:animate-pulse text-blue-400" />
                          <span className="text-xs">⚡ Quick Scan</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-vinyl-gold/10 group">
                      <Link to="/my-collection">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-6 h-6 group-hover:animate-pulse" />
                          <span className="text-xs">🔍 Mijn Collectie</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-vinyl-purple/10 group">
                      <Link to="/collection-chat">
                        <div className="flex flex-col items-center gap-2">
                          <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
                          <span className="text-xs">💬 Chat</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-green-500/10 group">
                      <Link to="/marketplace">
                        <div className="flex flex-col items-center gap-2">
                          <Shuffle className="w-6 h-6 group-hover:animate-pulse" />
                          <span className="text-xs">🛒 Marketplace</span>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Ontdek & Speel */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-medium">🎮 Ontdek & Speel</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Button asChild size="lg" className="h-16 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-lg group">
                      <Link to="/quizzen">
                        <div className="flex flex-col items-center gap-2">
                          <Trophy className="w-6 h-6 group-hover:animate-pulse" />
                          <span className="text-xs">🎯 Quizzen</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-purple-500/10 border-purple-500/30 group">
                      <Link to="/mijn-quizzen">
                        <div className="flex flex-col items-center gap-2">
                          <BarChart3 className="w-6 h-6 group-hover:animate-pulse text-purple-500" />
                          <span className="text-xs">🏆 Mijn Scores</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-pink-500/10 border-pink-500/30 group">
                      <Link to="/shop">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag className="w-6 h-6 group-hover:animate-pulse text-pink-500" />
                          <span className="text-xs">🛍️ Shop</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-cyan-500/10 border-cyan-500/30 group">
                      <Link to="/muziek-verhalen">
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="w-6 h-6 group-hover:animate-pulse text-cyan-500" />
                          <span className="text-xs">📖 Verhalen</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild size="lg" variant="outline" className="h-16 hover:bg-orange-500/10 border-orange-500/30 group">
                      <Link to="/nieuws">
                        <div className="flex flex-col items-center gap-2">
                          <Newspaper className="w-6 h-6 group-hover:animate-pulse text-orange-500" />
                          <span className="text-xs">📰 Nieuws</span>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Subscription Status */}
          <section className="mb-12 animate-fade-in delay-250">
            <SubscriptionStatus />
          </section>

          {/* Stats Cards */}
          <section className="mb-12 animate-fade-in delay-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-vinyl-purple" />
              📊 Jouw Muziek DNA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Totale Collectie"
                value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`}
                subtitle="Albums ontdekt"
                icon={Disc}
              />
              <StatCard
                title="Collectie Waarde"
                value={collectionLoading ? "..." : `€${collectionStats?.totalValue ? Math.round(collectionStats.totalValue) : 0}`}
                subtitle="Geschatte totaal"
                icon={TrendingUp}
              />
              <StatCard
                title="Deze Maand"
                value={statsLoading ? "..." : `${scanStats?.totalScans || 0}`}
                subtitle="Nieuwe scans"
                icon={Camera}
              />
              <StatCard
                title="Success Rate"
                value={statsLoading ? "..." : `${(scanStats?.successRate || 0).toFixed(1)}%`}
                subtitle="Geslaagde scans"
                icon={Star}
              />
            </div>
          </section>

          {/* AI & Interactive Widgets Section */}
          <section className="mb-12 animate-fade-in delay-400">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-vinyl-purple" />
              🚀 Jouw Muziek Command Center
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <EchoWidget />
              <AIInsightsWidget />
              <ChatWidget />
              <QuizWidget />
              <SpotifyWidget />
            </div>
          </section>

          {/* Next Goal Widget - Clean and Minimal */}
          <section className="mb-12 animate-fade-in delay-450">
            <NextGoalWidget 
              totalItems={collectionStats?.totalItems || 0}
              totalValue={collectionStats?.totalValue || 0}
              totalScans={scanStats?.totalScans || 0}
            />
          </section>

          {/* Fun & Interactive Section */}
          <section className="mb-12 animate-fade-in delay-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Disc className="w-6 h-6 text-vinyl-purple" />
              🎰 Muziek & Fun
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AlbumOfTheDay albums={unifiedAlbums || []} />
              <MusicStoryWidget />
              <CollectionPersonality 
                genres={collectionStats?.genres || []}
                totalItems={collectionStats?.totalItems || 0}
                totalValue={collectionStats?.totalValue || 0}
              />
            </div>
          </section>

          {/* Content & Community Section */}
          <section className="mb-12 animate-fade-in delay-600">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-vinyl-gold" />
              📚 Ontdek & Leer
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <UnifiedContentWidget />
              
              {/* Recent Activity */}
              <Card className="border-2 hover:border-accent/50 transition-all duration-300 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    🕒 Recente Activiteit
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
                            {scan.media_type === 'vinyl' ? (
                              <Disc className="w-6 h-6 text-vinyl-purple" />
                            ) : (
                              <Music className="w-6 h-6 text-vinyl-gold" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{scan.artist}</p>
                            <p className="text-sm text-muted-foreground truncate">{scan.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scan.created_at).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nog geen scans. Begin je collectie!</p>
                      <Button asChild className="mt-3">
                        <Link to="/scanner">
                          <Camera className="w-4 h-4 mr-2" />
                          Start Scannen
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Community Section - Latest Albums from all users */}
          <LatestAlbumsSection />

          {/* Navigation Shortcuts */}
          <section className="mb-12 animate-fade-in delay-700">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  🎯 Snelle Navigatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-purple/10">
                    <Link to="/collection-overview">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs">📊 Overzicht</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-gold/10">
                    <Link to="/collection-chat">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-xs">💬 Chat</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-accent/20">
                    <Link to="/my-shop">
                      <Star className="w-5 h-5" />
                      <span className="text-xs">🏪 Mijn Shop</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-secondary/50">
                    <Link to="/unified-scan-overview">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">📈 Alle Scans</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-amber-500/10">
                    <Link to="/quizzen">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="text-xs">🎯 Quizzen</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-purple-500/10">
                    <Link to="/mijn-quizzen">
                      <Target className="w-5 h-5 text-purple-500" />
                      <span className="text-xs">🏆 Scores</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-cyan-500/10">
                    <Link to="/artists">
                      <Users className="w-5 h-5 text-cyan-500" />
                      <span className="text-xs">🎤 Artiesten</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-pink-500/10">
                    <Link to="/shop">
                      <ShoppingBag className="w-5 h-5 text-pink-500" />
                      <span className="text-xs">🛍️ Shop</span>
                    </Link>
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
                  👥 Muziek Community
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
                    🎵 Je Muziekstijl
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">🎨 TOP GENRES</h4>
                      <div className="space-y-2">
                        {collectionStats.genres?.slice(0, 3).map((genre, index) => (
                          <div key={genre.genre} className="flex justify-between items-center">
                            <span className="text-sm">{genre.genre}</span>
                            <span className="text-xs text-muted-foreground">{genre.count} albums</span>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">Nog geen genres ontdekt</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">🎤 TOP ARTIESTEN</h4>
                      <div className="space-y-2">
                        {collectionStats.artists?.slice(0, 3).map((artist, index) => (
                          <div key={artist.artist} className="flex justify-between items-center">
                            <span className="text-sm">{artist.artist}</span>
                            <span className="text-xs text-muted-foreground">{artist.count} albums</span>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">Nog geen artiesten ontdekt</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Admin Tools Section - Only visible for admin */}
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
                    <Button 
                      asChild 
                      variant="outline" 
                      className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                    >
                      <Link to="/super-admin" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        SuperAdmin Dashboard
                      </Link>
                    </Button>
                    <BatchBlogGenerator />
                    <Button 
                      onClick={restartOnboarding}
                      variant="outline"
                      className="border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test Onboarding
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