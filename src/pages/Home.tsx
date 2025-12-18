import { useMemo } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { MasonryContentGrid } from '@/components/home/MasonryContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { Skeleton } from '@/components/ui/skeleton';

const SectionSkeleton = () => (
  <div className="py-10 bg-background">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
        <Skeleton className="aspect-square" />
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
  const { data: newsItems, isLoading } = useUnifiedNewsFeed(100);

  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  // Get exactly 1 item per type and shuffle
  const contentItems = useMemo(() => {
    if (!newsItems) return [];
    
    const types = ['single', 'artist', 'anecdote', 'release', 'youtube', 'review', 'history', 'album', 'product'];
    const uniqueItems = types
      .map(type => newsItems.find(i => i.type === type))
      .filter(Boolean);
    
    return shuffleArray(uniqueItems);
  }, [newsItems]);

  // Hero = most recent item overall (exclude from grid)
  const heroItem = newsItems?.[0];
  const gridItems = contentItems.filter(item => item?.id !== heroItem?.id);

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
      {/* Hero - 1 Featured Item */}
      {heroItem && (
        <section className="bg-black">
          <HeroFeature item={heroItem} />
        </section>
      )}

      {/* Quick Navigation */}
      <QuickLinks />

      {/* Masonry Grid - All content mixed randomly with varied sizes */}
      {gridItems.length > 0 && (
        <MasonryContentGrid items={gridItems} />
      )}

      {/* Product Banner */}
      <ProductBanner />

      {/* Shop Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
