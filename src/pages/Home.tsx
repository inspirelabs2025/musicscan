import { useMemo } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { ScannerHero } from '@/components/home/ScannerHero';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { MasonryContentGrid } from '@/components/home/MasonryContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';

import { EchoSpotlight } from '@/components/home/EchoSpotlight';
import { Skeleton } from '@/components/ui/skeleton';

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home = () => {
  const { data: newsItems, isLoading } = useUnifiedNewsFeed(200);

  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  // Hero = most recent item overall
  const heroItem = newsItems?.[0];

  // Build ONE large masonry grid with ALL content types mixed - RANDOM selection
  const allGridItems = useMemo(() => {
    if (!newsItems) return [];

    const excludedId = heroItem?.id;

    // Helper: get random items from ALL items of a type (geen pool limiet meer)
    // count: how many items to return, requireImage: filter alleen items met afbeelding
    const getRandomFromType = (type: string, count: number = 1, requireImage = false) => {
      const allOfType = newsItems
        .filter(i => i.type === type && i.id !== excludedId && (!requireImage || i.image_url));
      return shuffleArray(allOfType).slice(0, count);
    };

    // Random keuze tussen poster of canvas voor ART
    const artType = Math.random() > 0.5 ? 'poster' : 'canvas';

    // Bouw de grid met echte random items uit ALLE beschikbare content
    // REMOVED: news, history, quiz
    const items = shuffleArray([
      ...getRandomFromType('single', 2, true),     // 2 Singles (met artwork)
      ...getRandomFromType('artist', 2),           // 2 Artist verhalen
      ...getRandomFromType('album', 2),            // 2 Album verhalen
      ...getRandomFromType('release', 2),          // 2 Nieuwe releases
      ...getRandomFromType('youtube', 2),          // 2 Videos
      ...getRandomFromType('review', 1),           // 1 Review
      ...getRandomFromType('spotlight', 1),        // 1 Artiest Spotlight
      ...getRandomFromType('studio', 1),           // 1 Studio Story
      ...getRandomFromType('anecdote', 1),         // 1 Anekdote
      ...getRandomFromType('podcast', 1),          // 1 Podcast
      ...getRandomFromType('concert', 1),          // 1 Concert/Event
      ...getRandomFromType('fanwall', 2, true),    // 2 Fanwall (met afbeelding)
      ...getRandomFromType('product', 1),          // 1 Product
      ...getRandomFromType('metal_print', 1),      // 1 Metal Print
      ...getRandomFromType(artType, 1),            // 1 Poster OF Canvas
    ]).filter(item => item?.id !== heroItem?.id);

    return items;
  }, [newsItems, heroItem]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-10">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Scanner Hero - Grote CTA bovenaan */}
      <ScannerHero />
      {/* 2. Quick Navigation */}
      <QuickLinks />

      {/* 3. Hero - Featured Item */}
      {heroItem && (
        <section className="bg-black">
          <HeroFeature item={heroItem} />
        </section>
      )}

      {/* 3. ONE Masonry Grid - ALL content types mixed */}
      {allGridItems.length > 0 && (
        <MasonryContentGrid items={allGridItems} />
      )}

      {/* 4. Echo Spotlight - AI Music Expert */}
      <EchoSpotlight />

      {/* 5. Product Banner */}
      <ProductBanner />

    </div>
  );
};

export default Home;
