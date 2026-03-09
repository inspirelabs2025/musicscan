import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Search, Disc3, Disc, TrendingUp, Star, Clock, Music,
  MessageSquare, Trophy, Sparkles, BarChart3, Users, Zap,
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
import { BatchBlogGenerator } from '@/components/admin/BatchBlogGenerator';

const Dashboard2 = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { tr: t } = useLanguage();
  const ADMIN_EMAIL = 'rogiervisser76@gmail.com';
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
    <div className="min-h-screen bg-background overflow-x-hidden pt-14">

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[260px] md:min-h-[340px] bg-black overflow-hidden flex items-center -mt-14 pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/50 via-black to-vinyl-gold/30" />
        <div className="absolute -left-16 md:-left-20 top-1/2 -translate-y-1/2 opacity-15 md:opacity-25">
          <Disc3 className="w-48 h-48 md:w-72 md:h-72 text-vinyl-purple animate-vinyl-spin" />
        </div>
        <div className="absolute -right-16 md:-right-20 top-1/2 -translate-y-1/2 opacity-10 md:opacity-15">
          <Disc3 className="w-40 h-40 md:w-56 md:h-56 text-vinyl-gold animate-vinyl-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
        </div>

        <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px', textAlign: 'center', width: '100%', position: 'relative', zIndex: 10 }} className="py-8 md:py-14">
          <div className="inline-flex items-center gap-1.5 bg-vinyl-gold/20 text-vinyl-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-3 backdrop-blur-sm border border-vinyl-gold/30">
            <Zap className="w-3.5 h-3.5" />
            Jouw Dashboard
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight">
            {t.dashboard.welcomeBack}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-lg mx-auto mb-5">
            {t.dashboard.personalExperience}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }} className="mb-6">
            <Button asChild size="lg" className="bg-gradient-to-r from-vinyl-gold via-yellow-500 to-vinyl-gold hover:from-yellow-500 hover:via-vinyl-gold hover:to-yellow-500 text-black font-bold text-sm md:text-base px-6 md:px-8 py-4 md:py-5 rounded-xl shadow-2xl shadow-vinyl-gold/30 transition-all hover:scale-105">
              <Link to="/ai-scan-v2">
                <Camera className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                {t.dashboard.scanNow}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold text-sm md:text-base px-6 md:px-8 py-4 md:py-5 rounded-xl">
              <Link to="/my-collection">
                <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                {t.dashboard.myCollection}
              </Link>
            </Button>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="grid grid-cols-4 gap-2 md:gap-3" style={{ maxWidth: '520px', width: '100%' }}>
              {statItems.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 text-center">
                  <stat.icon className="w-3.5 h-3.5 text-vinyl-gold mx-auto mb-0.5" />
                  <div className="text-sm md:text-base font-bold text-white leading-tight">{stat.value}</div>
                  <div className="text-[9px] md:text-[10px] text-white/50 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTENT ═══ */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column' as const, gap: '48px', paddingTop: '48px', paddingBottom: '48px' }}>

        {/* ─── Slimme Tools: 2x2 grid ─── */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Slimme Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EchoWidget />
            <ChatWidget />
            <QuizWidget />
            <AIInsightsWidget />
          </div>
        </section>

        {/* ─── Mijn Collectie: 2 col ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Mijn Collectie</h2>
            <Link to="/my-collection" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors min-h-[44px]">
              Bekijk alles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AlbumOfTheDay albums={unifiedAlbums || []} />
            <CollectionPersonality
              genres={collectionStats?.genres || []}
              totalItems={collectionStats?.totalItems || 0}
              totalValue={collectionStats?.totalValue || 0}
            />
          </div>
        </section>

        {/* ─── Muziek Verhalen ─── */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Muziek Verhalen</h2>
          <MusicStoryWidget />
        </section>

        {/* ─── Account & Status: 2 col ─── */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Account & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <CreditsDisplay />
              <SubscriptionStatus />
            </div>
            <div className="space-y-4">
              <SpotifyWidget />

              {/* Recente Activiteit */}
              <div className="rounded-xl bg-card border border-border p-5 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-sm md:text-base">{t.dashboard.recentActivity}</h3>
                </div>
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
                  <div className="space-y-0">
                    {dashboardActivities.slice(0, 6).map((a) => (
                      <div key={`${a.type}-${a.id}`} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                        <span className="text-base shrink-0 w-7 text-center">{a.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{a.description}</p>
                          {a.details && <p className="text-xs text-muted-foreground truncate">{a.details}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
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
              </div>
            </div>
          </div>
        </section>

        {/* ─── Muziekstijl ─── */}
        {collectionStats && collectionStats.genres?.length > 0 && (
          <section className="rounded-xl bg-secondary/30 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{t.dashboard.yourMusicStyle}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {collectionStats.genres.slice(0, 5).map((g) => {
                const maxCount = collectionStats.genres?.[0]?.count || 1;
                const pct = Math.round((g.count / maxCount) * 100);
                return (
                  <div key={g.genre} className="rounded-xl bg-card border border-border p-4 shadow-md text-center">
                    <div className="text-2xl font-black text-primary mb-1">{g.count}</div>
                    <div className="text-sm font-semibold text-foreground mb-2 truncate">{g.genre}</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {collectionStats.artists && collectionStats.artists.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Top Artiesten</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                  {collectionStats.artists.slice(0, 8).map((a) => (
                    <div key={a.artist} className="flex-shrink-0 snap-start text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-card border border-border shadow-sm flex items-center justify-center mx-auto">
                        <span className="text-lg md:text-xl font-bold text-primary/60">{a.artist.charAt(0)}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate mt-2 w-16 md:w-20">{a.artist}</p>
                      <p className="text-[10px] text-muted-foreground">{a.count} items</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─── Ontdek & Leer ─── */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Ontdek & Leer</h2>
          <UnifiedContentWidget />
        </section>

        {/* ─── Nieuwste Uploads ─── */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Nieuwste Uploads</h2>
          <LatestAlbumsSection />
        </section>

        {/* ─── Snelle Navigatie ─── */}
        <section className="rounded-xl bg-card border border-border p-5 md:p-6 shadow-md">
          <h3 className="font-bold text-foreground text-base md:text-lg mb-4">Snelle Navigatie</h3>
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
              <Button key={to} asChild variant="outline" size="sm" className="min-h-[44px] text-xs md:text-sm">
                <Link to={to}>
                  <Icon className="w-4 h-4 mr-1.5" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </section>

        {/* ─── Admin ─── */}
        {user?.email === ADMIN_EMAIL && (
          <section className="rounded-xl bg-card border border-border p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground text-sm md:text-base">Admin Tools</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <Link to="/super-admin"><BarChart3 className="h-4 w-4 mr-1.5" />SuperAdmin</Link>
              </Button>
              <BatchBlogGenerator />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard2;
