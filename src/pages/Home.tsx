import { useMemo, lazy, Suspense } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { MasonryContentGrid } from '@/components/home/MasonryContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { EchoSpotlight } from '@/components/home/EchoSpotlight';
import { SpotifyNewReleasesSection } from '@/components/home/SpotifyNewReleasesSection';
import { DailyAnecdote } from '@/components/home/DailyAnecdote';
import { CommunityStats } from '@/components/home/CommunityStats';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load below-the-fold components
const PodcastSpotlight = lazy(() => import('@/components/home/PodcastSpotlight').then(m => ({ default: m.PodcastSpotlight })));
const TimeMachineSpotlight = lazy(() => import('@/components/home/TimeMachineSpotlight').then(m => ({ default: m.TimeMachineSpotlight })));
const ReviewsSpotlight = lazy(() => import('@/components/home/ReviewsSpotlight').then(m => ({ default: m.ReviewsSpotlight })));
const YouTubeDiscoveriesSection = lazy(() => import('@/components/home/YouTubeDiscoveriesSection').then(m => ({ default: m.YouTubeDiscoveriesSection })));
const MusicHistorySpotlight = lazy(() => import('@/components/home/MusicHistorySpotlight').then(m => ({ default: m.MusicHistorySpotlight })));

const SectionSkeleton = () => (
  <div className="py-10 bg-background">
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
);

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

  // Helper function to get items by type
  const getItemsByType = useMemo(() => {
    return (type: string, count: number) => 
      newsItems?.filter(i => i.type === type).slice(0, count) || [];
  }, [newsItems]);

  // Hero = most recent item overall
  const heroItem = newsItems?.[0];

  // Build content items for 3 grids (totaal ~19 items excl hero)
  const { gridOne, gridTwo, gridThree } = useMemo(() => {
    if (!newsItems) return { gridOne: [], gridTwo: [], gridThree: [] };

    // Grid 1: Mix van 9 items (diverse types)
    const grid1Items = shuffleArray([
      ...getItemsByType('single', 2),
      ...getItemsByType('artist', 2),
      ...getItemsByType('anecdote', 1),
      ...getItemsByType('release', 2),
      ...getItemsByType('history', 1),
      ...getItemsByType('product', 1),
    ]).filter(item => item?.id !== heroItem?.id).slice(0, 9);

    // Grid 2: Mix van 6 items (andere batch)
    const usedIds = new Set([heroItem?.id, ...grid1Items.map(i => i?.id)]);
    const grid2Items = shuffleArray([
      ...getItemsByType('album', 3),
      ...getItemsByType('review', 2),
      ...getItemsByType('youtube', 2),
    ]).filter(item => !usedIds.has(item?.id)).slice(0, 6);

    // Grid 3: Mix van 4 items (extra engagement)
    const usedIds2 = new Set([...usedIds, ...grid2Items.map(i => i?.id)]);
    const grid3Items = shuffleArray([
      ...getItemsByType('single', 2),
      ...getItemsByType('artist', 2),
      ...getItemsByType('product', 2),
    ]).filter(item => !usedIds2.has(item?.id)).slice(0, 4);

    return { gridOne: grid1Items, gridTwo: grid2Items, gridThree: grid3Items };
  }, [newsItems, heroItem, getItemsByType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Hero - Featured Item */}
      {heroItem && (
        <section className="bg-black">
          <HeroFeature item={heroItem} />
        </section>
      )}

      {/* 2. Quick Navigation */}
      <QuickLinks />

      {/* 3. Masonry Grid 1 - 9 items mixed randomly */}
      {gridOne.length > 0 && (
        <MasonryContentGrid items={gridOne} />
      )}

      {/* 4. Echo Spotlight - AI Music Expert */}
      <EchoSpotlight />

      {/* 5. Spotify New Releases Carousel */}
      <section className="bg-muted/20">
        <SpotifyNewReleasesSection />
      </section>

      {/* 6. Daily Anecdote */}
      <DailyAnecdote />

      {/* 7. Masonry Grid 2 - 6 more items */}
      {gridTwo.length > 0 && (
        <section className="bg-muted/30">
          <MasonryContentGrid items={gridTwo} title="Meer Verhalen & Videos" />
        </section>
      )}

      {/* 8. Podcast Spotlight */}
      <Suspense fallback={<SectionSkeleton />}>
        <PodcastSpotlight />
      </Suspense>

      {/* 9. Community Stats */}
      <CommunityStats />

      {/* 10. Time Machine Spotlight */}
      <Suspense fallback={<SectionSkeleton />}>
        <TimeMachineSpotlight />
      </Suspense>

      {/* 11. Masonry Grid 3 - 4 extra items */}
      {gridThree.length > 0 && (
        <MasonryContentGrid items={gridThree} title="Ontdek Meer" />
      )}

      {/* 12. Reviews Spotlight */}
      <Suspense fallback={<SectionSkeleton />}>
        <ReviewsSpotlight />
      </Suspense>

      {/* 13. YouTube Discoveries */}
      <Suspense fallback={<SectionSkeleton />}>
        <YouTubeDiscoveriesSection />
      </Suspense>

      {/* 14. Music History Today */}
      <Suspense fallback={<SectionSkeleton />}>
        <MusicHistorySpotlight />
      </Suspense>

      {/* 15. Product Banner */}
      <ProductBanner />

      {/* 16. Shop Categories Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
