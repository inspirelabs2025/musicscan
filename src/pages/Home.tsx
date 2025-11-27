import { SimpleHero } from '@/components/home/SimpleHero';
import { ArtistSearchHero } from '@/components/home/ArtistSearchHero';
import { QuickDiscoveryBar } from '@/components/home/QuickDiscoveryBar';
import { EchoSpotlight } from '@/components/home/EchoSpotlight';
import { MetalPrintSpotlight } from '@/components/home/MetalPrintSpotlight';
import { SocksSpotlight } from '@/components/home/SocksSpotlight';
import { TshirtSpotlight } from '@/components/home/TshirtSpotlight';
import { PodcastSpotlight } from '@/components/home/PodcastSpotlight';
import { TimeMachineSpotlight } from '@/components/home/TimeMachineSpotlight';
import { ShopByCategorySection } from '@/components/shop/ShopByCategorySection';
import { FeaturedProductsCarousel } from '@/components/shop/FeaturedProductsCarousel';
import { LatestReleasesSection } from '@/components/home/LatestReleasesSection';
import { SpotifyNewReleasesSection } from '@/components/home/SpotifyNewReleasesSection';
import { NewsAndStoriesSection } from '@/components/home/NewsAndStoriesSection';
import { ReviewsSpotlight } from '@/components/home/ReviewsSpotlight';
import { AIFeaturesCompact } from '@/components/home/AIFeaturesCompact';
import { CommunityStats } from '@/components/home/CommunityStats';
import { ArtistSpotlightsSection } from '@/components/home/ArtistSpotlightsSection';

import { FeaturedPhotos } from '@/components/FeaturedPhotos';
import { DailyAnecdote } from '@/components/home/DailyAnecdote';
import { MusicHistorySpotlight } from '@/components/home/MusicHistorySpotlight';
import { useSEO } from '@/hooks/useSEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Home = () => {
  const isMobile = useIsMobile();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  
  useSEO({
    title: "Vinyl Verzamelaar - Scan, Ontdek & Deel je Muziekcollectie",
    description: "Scan je platen en cd's met AI, ontdek prijzen en verhalen, deel met de community. 10.000+ albums gescand. Start gratis!",
  });

  return (
    <div className="min-h-screen">
      {/* Artist Search Hero - EERSTE ELEMENT */}
      <ArtistSearchHero />

      {/* Hero Section - Simple with 3 CTAs */}
      <SimpleHero />

      {/* Quick Discovery Bar */}
      <QuickDiscoveryBar />

      {/* Echo Spotlight - AI Music Guide */}
      <EchoSpotlight />

      {/* Metal Print Spotlight - Prominent ART Section */}
      <MetalPrintSpotlight />

      {/* Time Machine Spotlight */}
      <TimeMachineSpotlight />

      {/* Daily Music Anecdote */}
      <DailyAnecdote />

      {/* Spotify New Releases - Always visible */}
      <SpotifyNewReleasesSection />

      {/* Album Verhalen - Always visible on mobile */}
      {isMobile && <NewsAndStoriesSection />}

      {/* Music History - Always visible on mobile */}
      {isMobile && <MusicHistorySpotlight />}

      {/* Featured Photos from FanWall - Always visible */}
      <FeaturedPhotos />

      {/* T-shirts Spotlight - Always visible */}
      <TshirtSpotlight />

      {/* Podcast Spotlight - Always visible */}
      <PodcastSpotlight />

      {/* Shop Categories - Compact on mobile */}
      <section className={isMobile ? "py-8 bg-muted/30" : "py-16 bg-muted/30"}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
              🛍️ Onze Shop
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Van vintage vinyl tot moderne art prints
              </p>
            )}
          </div>
          <ShopByCategorySection />
        </div>
      </section>

      {/* Featured Products - Compact on mobile */}
      <section className={isMobile ? "py-8" : "py-16"}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
              ⭐ Uitgelichte Producten
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Handpicked items uit onze collectie
              </p>
            )}
          </div>
          <FeaturedProductsCarousel />
        </div>
      </section>

      {/* Latest Releases */}
      <LatestReleasesSection />

      {/* Album Reviews Spotlight */}
      <ReviewsSpotlight />

      {/* More Features - Collapsible on mobile */}
      {isMobile && !showMoreFeatures ? (
        <div className="py-8 text-center">
          <button
            onClick={() => setShowMoreFeatures(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
          >
            Bekijk Meer Content
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}

      {/* Final CTA - Compact on mobile */}
      <section className={isMobile ? "py-8 bg-gradient-to-br from-vinyl-purple/20 via-vinyl-gold/20 to-accent/20" : "py-16 bg-gradient-to-br from-vinyl-purple/20 via-vinyl-gold/20 to-accent/20"}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className={isMobile ? "text-2xl md:text-3xl font-bold" : "text-4xl md:text-5xl font-bold"}>
              Klaar om te Beginnen?
            </h2>
            {!isMobile && (
              <p className="text-xl text-muted-foreground">
                Sluit je aan bij duizenden muziekliefhebbers en ontdek wat je collectie waard is
              </p>
            )}
            <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex gap-4 justify-center flex-wrap"}>
              <a
                href="/shop"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-vinyl-gold to-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all" : "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-vinyl-gold to-amber-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"}
              >
                🛍️ Shop
              </a>
              <a
                href="/music-news"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg border-2 border-primary bg-transparent px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all" : "inline-flex items-center justify-center rounded-lg border-2 border-primary bg-transparent px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-all"}
              >
                📰 Nieuws
              </a>
              <a
                href="/auth"
                className={isMobile ? "inline-flex items-center justify-center rounded-lg border-2 border-vinyl-purple bg-transparent px-3 py-2.5 text-sm font-semibold text-vinyl-purple hover:bg-vinyl-purple/10 transition-all col-span-2" : "inline-flex items-center justify-center rounded-lg border-2 border-vinyl-purple bg-transparent px-8 py-4 text-lg font-semibold text-vinyl-purple hover:bg-vinyl-purple/10 transition-all"}
              >
                📸 Scan Gratis
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
