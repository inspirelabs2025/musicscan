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
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionStats } from '@/hooks/useCollectionStats';
import { useDirectScans } from '@/hooks/useDirectScans';
import { useUnifiedAlbums } from '@/hooks/useUnifiedAlbums';
import { useUnifiedScansStats } from '@/hooks/useUnifiedScansStats';
import { useUserStats } from '@/hooks/useUserStats';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { ChatWidget } from '@/components/dashboard/ChatWidget';
import { QuizWidget } from '@/components/dashboard/QuizWidget';
import { SpotifyWidget } from '@/components/dashboard/SpotifyWidget';
import { EnhancedNewsWidget } from '@/components/dashboard/EnhancedNewsWidget';
import { BatchBlogGenerator } from '@/components/admin/BatchBlogGenerator';
import { LatestAlbumsSection } from '@/components/LatestAlbumsSection';
import { NewUsersSection } from '@/components/NewUsersSection';
import { IntegratedAchievementSystem } from '@/components/dashboard/IntegratedAchievementSystem';
import { AlbumOfTheDay } from '@/components/dashboard/AlbumOfTheDay';
import { CollectionPersonality } from '@/components/dashboard/CollectionPersonality';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { NextGoalWidget } from '@/components/dashboard/NextGoalWidget';
import { BlogPreviewWidget } from '@/components/dashboard/BlogPreviewWidget';
import { MusicStoryWidget } from '@/components/dashboard/MusicStoryWidget';

const Dashboard = () => {
  const { user } = useAuth();
  const ADMIN_EMAIL = 'rogiervisser76@gmail.com';
  const { data: collectionStats, isLoading: collectionLoading } = useCollectionStats();
  const { data: recentScans, isLoading: scansLoading } = useDirectScans();
  const { data: unifiedAlbums, isLoading: albumsLoading } = useUnifiedAlbums();
  const { data: scanStats, isLoading: statsLoading } = useUnifiedScansStats();
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();

  // Get recent scans (last 5)
  const latestScans = recentScans?.slice(0, 5) || [];

  return (
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild size="lg" className="h-16 bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80 hover:shadow-lg group">
                  <Link to="/scanner">
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-6 h-6 group-hover:animate-pulse" />
                      <span>📸 Scan Nu</span>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="h-16 hover:bg-vinyl-gold/10 group">
                  <Link to="/my-collection">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 group-hover:animate-pulse" />
                      <span>🔍 Mijn Collectie</span>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="h-16 hover:bg-vinyl-purple/10 group">
                  <Link to="/collection-chat">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
                      <span>💬 Chat met collectie</span>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="h-16 hover:bg-green-500/10 group">
                  <Link to="/marketplace">
                    <div className="flex flex-col items-center gap-2">
                      <Shuffle className="w-6 h-6 group-hover:animate-pulse" />
                      <span>🛒 Marketplace</span>
                    </div>
                  </Link>
                </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BlogPreviewWidget />
            <EnhancedNewsWidget />
            
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
                <Zap className="w-5 h-5 text-primary" />
                🎯 Snelle Navigatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-purple/10">
                  <Link to="/collection-overview">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs">📊 Collectie Overzicht</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-16 flex flex-col gap-2 hover:bg-vinyl-gold/10">
                  <Link to="/collection-chat">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs">💬 Collectie Chat</span>
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
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-vinyl-purple" />
              ⚡ Admin Tools
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* SuperAdmin Dashboard Card */}
              <Card className="border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    🛡️ SuperAdmin Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Toegang tot volledige system administratie, gebruikersbeheer en podcast management.
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    <Link to="/superadmin-dashboard?key=superadmin_secret_2024">
                      <Shield className="w-4 h-4 mr-2" />
                      Open SuperAdmin Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Batch Blog Generator Card */}
              <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-vinyl-purple" />
                    📝 Blog Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Automatisch blog posts genereren voor albums in de collectie.
                  </p>
                  <div className="max-w-full">
                    <BatchBlogGenerator />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Dashboard;