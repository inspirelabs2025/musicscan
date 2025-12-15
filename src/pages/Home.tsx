import { SimpleHero } from '@/components/home/SimpleHero';
import { ArtistSearchHero } from '@/components/home/ArtistSearchHero';
import { PublicScannerSpotlight } from '@/components/home/PublicScannerSpotlight';
import { EchoSpotlight } from '@/components/home/EchoSpotlight';
import { MetalPrintSpotlight } from '@/components/home/MetalPrintSpotlight';
import { SocksSpotlight } from '@/components/home/SocksSpotlight';
import { TshirtSpotlight } from '@/components/home/TshirtSpotlight';
import { PodcastSpotlight } from '@/components/home/PodcastSpotlight';
import { TimeMachineSpotlight } from '@/components/home/TimeMachineSpotlight';
import { ShopByCategorySection } from '@/components/shop/ShopByCategorySection';
import { FeaturedProductsCarousel } from '@/components/shop/FeaturedProductsCarousel';

import { SpotifyNewReleasesSection } from '@/components/home/SpotifyNewReleasesSection';
import { NewsAndStoriesSection } from '@/components/home/NewsAndStoriesSection';
import { ReviewsSpotlight } from '@/components/home/ReviewsSpotlight';
import { AIFeaturesCompact } from '@/components/home/AIFeaturesCompact';
import { CommunityStats } from '@/components/home/CommunityStats';
import { ArtistSpotlightsSection } from '@/components/home/ArtistSpotlightsSection';
import { YouTubeDiscoveriesSection } from '@/components/home/YouTubeDiscoveriesSection';

import { FeaturedPhotos } from '@/components/FeaturedPhotos';
import { DailyAnecdote } from '@/components/home/DailyAnecdote';
import { MusicHistorySpotlight } from '@/components/home/MusicHistorySpotlight';
import { useSEO } from '@/hooks/useSEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { SnowfallOverlay } from '@/components/christmas/SnowfallOverlay';
import { ChristmasHeroBanner } from '@/components/christmas/ChristmasHeroBanner';

const Home = () => {
  const isMobile = useIsMobile();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  
  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-christmas-cream via-background to-christmas-cream/50 dark:from-christmas-burgundy/20 dark:via-background dark:to-christmas-pine/20">
      {/* Snowfall overlay - background */}
      <SnowfallOverlay />

      {/* Christmas Hero Banner - TOP */}
      <ChristmasHeroBanner />

      {/* Artist Search Hero */}
      <section className="relative z-10">
        <ArtistSearchHero />
      </section>

      {/* Public Scanner - Scan je collectie */}
      <section className="relative z-10">
        <PublicScannerSpotlight />
      </section>

      {/* Hero Section - Simple with 3 CTAs */}
      <section className="relative z-10">
        <SimpleHero />
      </section>

      {/* Echo Spotlight - AI Music Guide */}
      <section className="relative z-10">
        <EchoSpotlight />
      </section>

      {/* Metal Print Spotlight - Prominent ART Section */}
      <section className="relative z-10">
        <MetalPrintSpotlight />
      </section>

      {/* Time Machine Spotlight */}
      <section className="relative z-10">
        <TimeMachineSpotlight />
      </section>

      {/* Daily Music Anecdote */}
      <section className="relative z-10">
        <DailyAnecdote />
      </section>

      {/* Spotify New Releases - Always visible */}
      <section className="relative z-10">
        <SpotifyNewReleasesSection />
      </section>

      {/* Album Verhalen - Always visible on mobile */}
      {isMobile && (
        <section className="relative z-10">
          <NewsAndStoriesSection />
        </section>
      )}

      {/* Music History - Always visible on mobile */}
      {isMobile && (
        <section className="relative z-10">
          <MusicHistorySpotlight />
        </section>
      )}

      {/* Featured Photos from FanWall - Always visible */}
      <section className="relative z-10">
        <FeaturedPhotos />
      </section>

      {/* T-shirts Spotlight - Always visible */}
      <section className="relative z-10">
        <TshirtSpotlight />
      </section>

      {/* Podcast Spotlight - Always visible */}
      <section className="relative z-10">
        <PodcastSpotlight />
      </section>

      {/* YouTube Discoveries Section */}
      <section className="relative z-10">
        <YouTubeDiscoveriesSection />
      </section>

      {/* Shop Categories - Christmas themed */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-christmas-red/10 via-christmas-gold/10 to-christmas-green/10`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
              🎁 Kerst Cadeaus
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Unieke muziekcadeaus voor onder de kerstboom
              </p>
            )}
          </div>
          <ShopByCategorySection />
        </div>
      </section>

      {/* Featured Products - Christmas themed */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-christmas-cream/30 dark:bg-christmas-burgundy/10`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
              ⭐ Uitgelichte Cadeaus
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Handpicked items voor muziekliefhebbers
              </p>
            )}
          </div>
          <FeaturedProductsCarousel />
        </div>
      </section>


      {/* Album Reviews Spotlight */}
      <section className="relative z-10">
        <ReviewsSpotlight />
      </section>

      {/* More Features - Collapsible on mobile */}
      {isMobile && !showMoreFeatures ? (
        <div className="py-8 text-center relative z-10">
          <button
            onClick={() => setShowMoreFeatures(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-christmas-red text-white rounded-lg hover:bg-christmas-red/90 transition-all"
          >
            Bekijk Meer Content
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative z-10">
          {/* News & Stories Section with Tabs - Desktop only here */}
          {!isMobile && <NewsAndStoriesSection />}

          {/* Artist Spotlights - Compact Section */}
          <ArtistSpotlightsSection />

          {/* Music History - Desktop only here */}
          {!isMobile && <MusicHistorySpotlight />}

          {/* AI Features - Compact */}
          <AIFeaturesCompact />

          {/* Community Stats */}
          <CommunityStats />
        </div>
      )}

      {/* Final CTA - Christmas themed */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-christmas-red/30 via-christmas-gold/20 to-christmas-green/30`}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className={isMobile ? "text-2xl md:text-3xl font-bold" : "text-4xl md:text-5xl font-bold"}>
              🎄 Fijne Feestdagen!
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Ontdek de magie van muziek deze kerst
              </p>
            )}
            <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex gap-4 justify-center flex-wrap"}>
              <a
                href="/kerst"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-christmas-red to-christmas-burgundy px-3 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all" : "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-christmas-red to-christmas-burgundy px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"}
              >
                🎵 Kerstverhalen
              </a>
              <a
                href="/shop"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-christmas-gold to-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all" : "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-christmas-gold to-amber-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"}
              >
                🎁 Cadeaus
              </a>
              <a
                href="/quizzen"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg border-2 border-christmas-green bg-christmas-green/10 px-3 py-2.5 text-sm font-semibold text-christmas-green hover:bg-christmas-green/20 transition-all col-span-2" : "inline-flex items-center justify-center rounded-lg border-2 border-christmas-green bg-christmas-green/10 px-8 py-4 text-lg font-semibold text-christmas-green hover:bg-christmas-green/20 transition-all"}
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
