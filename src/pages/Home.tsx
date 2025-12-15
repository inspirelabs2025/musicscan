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
import { ChristmasDecorations } from '@/components/christmas/ChristmasDecorations';

const Home = () => {
  const isMobile = useIsMobile();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  
  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  return (
    <div className="min-h-screen relative bg-christmas-cream dark:bg-christmas-burgundy/30">
      {/* Christmas Decorations - fairy lights & ornaments */}
      <ChristmasDecorations />
      
      {/* Snowfall overlay - background */}
      <SnowfallOverlay />

      {/* Artist Search Hero - Christmas styled */}
      <section className="relative z-10 bg-gradient-to-b from-christmas-burgundy via-christmas-red/90 to-christmas-gold/20">
        <ArtistSearchHero />
      </section>

      {/* Public Scanner - Scan je collectie */}
      <section className="relative z-10 bg-christmas-cream/80 dark:bg-christmas-pine/30">
        <PublicScannerSpotlight />
      </section>

      {/* Hero Section - Simple with 3 CTAs */}
      <section className="relative z-10 bg-gradient-to-b from-christmas-gold/10 to-christmas-cream dark:from-christmas-gold/20 dark:to-christmas-burgundy/20">
        <SimpleHero />
      </section>

      {/* Echo Spotlight - AI Music Guide */}
      <section className="relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
        <EchoSpotlight />
      </section>

      {/* Metal Print Spotlight - Prominent ART Section */}
      <section className="relative z-10 bg-gradient-to-br from-christmas-red/10 via-christmas-cream to-christmas-green/10 dark:from-christmas-red/20 dark:via-christmas-burgundy/30 dark:to-christmas-pine/20">
        <MetalPrintSpotlight />
      </section>

      {/* Time Machine Spotlight */}
      <section className="relative z-10 bg-christmas-cream/90 dark:bg-christmas-pine/20">
        <TimeMachineSpotlight />
      </section>

      {/* Daily Music Anecdote */}
      <section className="relative z-10 bg-gradient-to-b from-christmas-gold/15 to-christmas-cream dark:from-christmas-gold/10 dark:to-christmas-burgundy/20">
        <DailyAnecdote />
      </section>

      {/* Spotify New Releases - Always visible */}
      <section className="relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
        <SpotifyNewReleasesSection />
      </section>

      {/* Album Verhalen - Always visible on mobile */}
      {isMobile && (
        <section className="relative z-10 bg-christmas-cream/80 dark:bg-christmas-pine/20">
          <NewsAndStoriesSection />
        </section>
      )}

      {/* Music History - Always visible on mobile */}
      {isMobile && (
        <section className="relative z-10 bg-gradient-to-b from-christmas-red/10 to-christmas-cream dark:from-christmas-red/20 dark:to-christmas-burgundy/20">
          <MusicHistorySpotlight />
        </section>
      )}

      {/* Featured Photos from FanWall - Always visible */}
      <section className="relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
        <FeaturedPhotos />
      </section>

      {/* T-shirts Spotlight - Always visible */}
      <section className="relative z-10 bg-gradient-to-br from-christmas-green/10 via-christmas-cream to-christmas-gold/10 dark:from-christmas-pine/30 dark:via-christmas-burgundy/20 dark:to-christmas-gold/10">
        <TshirtSpotlight />
      </section>

      {/* Podcast Spotlight - Always visible */}
      <section className="relative z-10 bg-christmas-cream/90 dark:bg-christmas-pine/20">
        <PodcastSpotlight />
      </section>

      {/* YouTube Discoveries Section */}
      <section className="relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
        <YouTubeDiscoveriesSection />
      </section>

      {/* Shop Categories - Christmas themed */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-christmas-red/20 via-christmas-gold/20 to-christmas-green/20 dark:from-christmas-red/30 dark:via-christmas-gold/15 dark:to-christmas-pine/30`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={`${isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"} text-christmas-burgundy dark:text-christmas-cream`}>
              🎁 Kerst Cadeaus
            </h2>
            {!isMobile && (
              <p className="text-xl text-christmas-burgundy/70 dark:text-christmas-cream/70">
                Unieke muziekcadeaus voor onder de kerstboom
              </p>
            )}
          </div>
          <ShopByCategorySection />
        </div>
      </section>

      {/* Featured Products - Christmas themed */}
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-christmas-cream dark:bg-christmas-burgundy/30`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={`${isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"} text-christmas-burgundy dark:text-christmas-cream`}>
              ⭐ Uitgelichte Cadeaus
            </h2>
            {!isMobile && (
              <p className="text-xl text-christmas-burgundy/70 dark:text-christmas-cream/70">
                Handpicked items voor muziekliefhebbers
              </p>
            )}
          </div>
          <FeaturedProductsCarousel />
        </div>
      </section>


      {/* Album Reviews Spotlight */}
      <section className="relative z-10 bg-gradient-to-b from-christmas-cream to-christmas-gold/10 dark:from-christmas-burgundy/20 dark:to-christmas-gold/10">
        <ReviewsSpotlight />
      </section>

      {/* More Features - Collapsible on mobile */}
      {isMobile && !showMoreFeatures ? (
        <div className="py-8 text-center relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
          <button
            onClick={() => setShowMoreFeatures(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-christmas-red text-christmas-cream rounded-lg hover:bg-christmas-burgundy transition-all shadow-lg"
          >
            Bekijk Meer Content
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative z-10 bg-christmas-cream dark:bg-christmas-burgundy/20">
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
      <section className={`relative z-10 ${isMobile ? "py-8" : "py-16"} bg-gradient-to-br from-christmas-red via-christmas-burgundy to-christmas-pine`}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className={`${isMobile ? "text-2xl md:text-3xl font-bold" : "text-4xl md:text-5xl font-bold"} text-christmas-cream`}>
              🎄 Fijne Feestdagen!
            </h2>
            {!isMobile && (
              <p className="text-xl text-christmas-cream/80">
                Ontdek de magie van muziek deze kerst
              </p>
            )}
            <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex gap-4 justify-center flex-wrap"}>
              <a
                href="/kerst"
                className={`${isMobile ? "px-3 py-2.5 text-sm" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg bg-christmas-gold text-christmas-burgundy font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                🎵 Kerstverhalen
              </a>
              <a
                href="/shop"
                className={`${isMobile ? "px-3 py-2.5 text-sm" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg bg-christmas-cream text-christmas-burgundy font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                🎁 Cadeaus
              </a>
              <a
                href="/quizzen"
                className={`${isMobile ? "px-3 py-2.5 text-sm col-span-2" : "px-8 py-4 text-lg"} inline-flex items-center justify-center rounded-lg border-2 border-christmas-gold bg-christmas-gold/20 text-christmas-cream font-semibold hover:bg-christmas-gold/30 transition-all`}
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
