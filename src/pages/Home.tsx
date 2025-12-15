import { lazy, Suspense, useState } from 'react';
import { ArtistSearchHero } from '@/components/home/ArtistSearchHero';
import { PublicScannerSpotlight } from '@/components/home/PublicScannerSpotlight';
import { SimpleHero } from '@/components/home/SimpleHero';
import { useSEO } from '@/hooks/useSEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load below-fold components for better initial load
const EchoSpotlight = lazy(() => import('@/components/home/EchoSpotlight').then(m => ({ default: m.EchoSpotlight })));
const MetalPrintSpotlight = lazy(() => import('@/components/home/MetalPrintSpotlight').then(m => ({ default: m.MetalPrintSpotlight })));
const SocksSpotlight = lazy(() => import('@/components/home/SocksSpotlight').then(m => ({ default: m.SocksSpotlight })));
const TshirtSpotlight = lazy(() => import('@/components/home/TshirtSpotlight').then(m => ({ default: m.TshirtSpotlight })));
const PodcastSpotlight = lazy(() => import('@/components/home/PodcastSpotlight').then(m => ({ default: m.PodcastSpotlight })));
const TimeMachineSpotlight = lazy(() => import('@/components/home/TimeMachineSpotlight').then(m => ({ default: m.TimeMachineSpotlight })));
const ShopByCategorySection = lazy(() => import('@/components/shop/ShopByCategorySection').then(m => ({ default: m.ShopByCategorySection })));
const FeaturedProductsCarousel = lazy(() => import('@/components/shop/FeaturedProductsCarousel').then(m => ({ default: m.FeaturedProductsCarousel })));
const SpotifyNewReleasesSection = lazy(() => import('@/components/home/SpotifyNewReleasesSection').then(m => ({ default: m.SpotifyNewReleasesSection })));
const NewsAndStoriesSection = lazy(() => import('@/components/home/NewsAndStoriesSection').then(m => ({ default: m.NewsAndStoriesSection })));
const ReviewsSpotlight = lazy(() => import('@/components/home/ReviewsSpotlight').then(m => ({ default: m.ReviewsSpotlight })));
const AIFeaturesCompact = lazy(() => import('@/components/home/AIFeaturesCompact').then(m => ({ default: m.AIFeaturesCompact })));
const CommunityStats = lazy(() => import('@/components/home/CommunityStats').then(m => ({ default: m.CommunityStats })));
const ArtistSpotlightsSection = lazy(() => import('@/components/home/ArtistSpotlightsSection').then(m => ({ default: m.ArtistSpotlightsSection })));
const YouTubeDiscoveriesSection = lazy(() => import('@/components/home/YouTubeDiscoveriesSection').then(m => ({ default: m.YouTubeDiscoveriesSection })));
const FeaturedPhotos = lazy(() => import('@/components/FeaturedPhotos').then(m => ({ default: m.FeaturedPhotos })));
const DailyAnecdote = lazy(() => import('@/components/home/DailyAnecdote').then(m => ({ default: m.DailyAnecdote })));
const MusicHistorySpotlight = lazy(() => import('@/components/home/MusicHistorySpotlight').then(m => ({ default: m.MusicHistorySpotlight })));
const SnowfallOverlay = lazy(() => import('@/components/christmas/SnowfallOverlay').then(m => ({ default: m.SnowfallOverlay })));

// Lightweight section skeleton for lazy-loaded components
const SectionSkeleton = () => (
  <div className="py-8 md:py-12">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mx-auto mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  </div>
);

const Home = () => {
  const isMobile = useIsMobile();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  
  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-green-50/70 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10">
      {/* Subtle Snowfall - lazy loaded */}
      <Suspense fallback={null}>
        <SnowfallOverlay />
      </Suspense>

      {/* Artist Search Hero - Above fold, no lazy load */}
      <section className="relative z-10 bg-gradient-to-b from-red-800 via-red-700 to-green-800/80">
        <ArtistSearchHero />
      </section>

      {/* Public Scanner - Above fold, no lazy load */}
      <section className="relative z-10 bg-green-50/50 dark:bg-green-950/20">
        <PublicScannerSpotlight />
      </section>

      {/* Hero Section - Above fold, no lazy load */}
      <section className="relative z-10 bg-gradient-to-b from-green-50/30 to-red-50/30 dark:from-green-950/10 dark:to-red-950/10">
        <SimpleHero />
      </section>

      {/* Below-fold sections - Lazy loaded */}
      <Suspense fallback={<SectionSkeleton />}>
        {/* Echo Spotlight */}
        <section className="relative z-10 bg-red-50/30 dark:bg-red-950/10">
          <EchoSpotlight />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Metal Print Spotlight */}
        <section className="relative z-10 bg-gradient-to-br from-green-100/50 via-white to-red-100/50 dark:from-green-950/20 dark:via-background dark:to-red-950/20">
          <MetalPrintSpotlight />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Time Machine */}
        <section className="relative z-10 bg-green-50/40 dark:bg-green-950/10">
          <TimeMachineSpotlight />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Daily Anecdote */}
        <section className="relative z-10 bg-red-50/30 dark:bg-red-950/10">
          <DailyAnecdote />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Spotify Releases */}
        <section className="relative z-10 bg-green-50/30 dark:bg-green-950/10">
          <SpotifyNewReleasesSection />
        </section>
      </Suspense>

      {/* Album Verhalen - Mobile */}
      {isMobile && (
        <Suspense fallback={<SectionSkeleton />}>
          <section className="relative z-10 bg-red-50/20 dark:bg-red-950/10">
            <NewsAndStoriesSection />
          </section>
        </Suspense>
      )}

      {/* Music History - Mobile */}
      {isMobile && (
        <Suspense fallback={<SectionSkeleton />}>
          <section className="relative z-10 bg-green-50/30 dark:bg-green-950/10">
            <MusicHistorySpotlight />
          </section>
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton />}>
        {/* Featured Photos */}
        <section className="relative z-10 bg-red-50/20 dark:bg-red-950/10">
          <FeaturedPhotos />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* T-shirts */}
        <section className="relative z-10 bg-gradient-to-br from-green-100/40 via-white to-red-100/40 dark:from-green-950/15 dark:via-background dark:to-red-950/15">
          <TshirtSpotlight />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Podcast */}
        <section className="relative z-10 bg-green-50/30 dark:bg-green-950/10">
          <PodcastSpotlight />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* YouTube */}
        <section className="relative z-10 bg-red-50/30 dark:bg-red-950/10">
          <YouTubeDiscoveriesSection />
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Shop Categories */}
        <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-red-100/50 via-green-50/30 to-red-100/50 dark:from-red-950/20 dark:via-green-950/10 dark:to-red-950/20`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className={`${isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"} text-red-900 dark:text-red-100 flex items-center justify-center gap-2`}>
                <span className="text-green-600">🎄</span> Kerst Cadeaus
              </h2>
              {!isMobile && (
                <p className="text-xl text-red-800/70 dark:text-red-200/70">
                  Unieke muziekcadeaus voor onder de kerstboom
                </p>
              )}
            </div>
            <ShopByCategorySection />
          </div>
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Featured Products */}
        <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-green-50/40 dark:bg-green-950/10`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className={`${isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"} text-green-900 dark:text-green-100 flex items-center justify-center gap-2`}>
                <span className="text-red-600">🎁</span> Uitgelichte Cadeaus
              </h2>
              {!isMobile && (
                <p className="text-xl text-green-800/70 dark:text-green-200/70">
                  Handpicked items voor muziekliefhebbers
                </p>
              )}
            </div>
            <FeaturedProductsCarousel />
          </div>
        </section>
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        {/* Reviews */}
        <section className="relative z-10 bg-red-50/20 dark:bg-red-950/10">
          <ReviewsSpotlight />
        </section>
      </Suspense>

      {/* More Features - Collapsible on mobile */}
      {isMobile && !showMoreFeatures ? (
        <div className="py-8 text-center relative z-10 bg-green-50/30 dark:bg-green-950/10">
          <button
            onClick={() => setShowMoreFeatures(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all shadow-lg"
          >
            🎄 Bekijk Meer Content
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Suspense fallback={<SectionSkeleton />}>
          <div className="relative z-10 bg-gradient-to-b from-green-50/20 to-red-50/20 dark:from-green-950/10 dark:to-red-950/10">
            {!isMobile && <NewsAndStoriesSection />}
            <ArtistSpotlightsSection />
            {!isMobile && <MusicHistorySpotlight />}
            <AIFeaturesCompact />
            <CommunityStats />
          </div>
        </Suspense>
      )}

      {/* Final CTA */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-red-800 via-green-800 to-red-900`}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className={`${isMobile ? "text-2xl md:text-3xl font-bold" : "text-4xl md:text-5xl font-bold"} text-white flex items-center justify-center gap-3`}>
              🎄 Fijne Feestdagen!
            </h2>
            {!isMobile && (
              <p className="text-xl text-green-100/80">
                Ontdek de magie van muziek deze kerst
              </p>
            )}
            <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex gap-4 justify-center flex-wrap"}>
              <a
                href="/kerst"
                className={`${isMobile ? "px-3 py-2.5 text-sm" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg bg-white text-red-800 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                🎵 Kerstverhalen
              </a>
              <a
                href="/shop"
                className={`${isMobile ? "px-3 py-2.5 text-sm" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg bg-green-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                🎁 Cadeaus
              </a>
              <a
                href="/quizzen"
                className={`${isMobile ? "px-3 py-2.5 text-sm col-span-2" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg border-2 border-white/50 bg-white/10 text-white font-semibold hover:bg-white/20 transition-all`}
              >
                🎄 Kerstquiz
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
