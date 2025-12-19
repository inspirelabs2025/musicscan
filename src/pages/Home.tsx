import { useMemo } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { MasonryContentGrid } from '@/components/home/MasonryContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { EchoSpotlight } from '@/components/home/EchoSpotlight';
import { CommunityStats } from '@/components/home/CommunityStats';
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

    // Helper: get random items from a pool of recent items (en nooit de hero dupliceren)
    // count: how many items to return, requireImage: filter alleen items met afbeelding
    const getRandomFromType = (type: string, poolSize: number = 20, count: number = 1, requireImage = false) => {
      const pool = newsItems
        .filter(i => i.type === type && i.id !== excludedId && (!requireImage || i.image_url))
        .slice(0, poolSize);
      return shuffleArray(pool).slice(0, count);
    };

    // NIEUWS: Pak de 2 laatste nieuwsberichten
    const latestNews = newsItems.filter(i => i.type === 'news' && i.id !== excludedId).slice(0, 2);

    // MUZIEKGESCHIEDENIS: meerdere items van vandaag (als beschikbaar)
    const historyItems = (() => {
      const picks = getRandomFromType('history', 8, 3);
      if (picks.length) return picks;
      // Fallback met datum van vandaag
      const today = new Date();
      const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
      return [
        {
          id: 'history-promo',
          type: 'history' as const,
          title: `📅 ${today.getDate()} ${monthNames[today.getMonth()]}`,
          subtitle: 'Ontdek wat er vandaag in de muziekgeschiedenis gebeurde',
          image_url: undefined,
          category_label: 'MUZIEKGESCHIEDENIS',
          link: '/vandaag-in-de-muziekgeschiedenis',
          date: new Date().toISOString(),
        },
      ];
    })();

    // Random keuze tussen poster of canvas voor ART
    const artType = Math.random() > 0.5 ? 'poster' : 'canvas';

    // Bouw de grid met de juiste aantallen per type
    const items = shuffleArray([
      ...getRandomFromType('single', 20, 2, true),     // 2 Singles (met artwork)
      ...getRandomFromType('artist', 20, 2),           // 2 Artist verhalen
      ...getRandomFromType('album', 20, 2),            // 2 Album verhalen
      ...getRandomFromType('release', 20, 2),          // 2 Nieuwe releases
      ...getRandomFromType('youtube', 20, 2),          // 2 Videos
      ...historyItems,                                  // Muziekgeschiedenis (meerdere)
      ...getRandomFromType('review', 20, 1),           // 1 Review
      ...getRandomFromType('spotlight', 20, 1),        // 1 Artiest Spotlight (NIEUW)
      ...getRandomFromType('studio', 20, 1),           // 1 Studio Story (NIEUW)
      ...getRandomFromType('anecdote', 20, 1),         // 1 Anekdote
      ...getRandomFromType('podcast', 20, 1),          // 1 Podcast
      ...getRandomFromType('concert', 20, 1),          // 1 Concert/Event
      ...getRandomFromType('fanwall', 10, 2, true),    // 2 Fanwall (met afbeelding)
      ...latestNews,                                    // 2 Nieuwsitems
      ...getRandomFromType('product', 20, 1),          // 1 Product
      ...getRandomFromType('metal_print', 20, 1),      // 1 Metal Print
      ...getRandomFromType(artType, 20, 1),            // 1 Poster OF Canvas
      ...getRandomFromType('quiz', 20, 1),             // 1 Quiz van de dag
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
      {/* 1. Hero - Featured Item */}
      {heroItem && (
        <section className="bg-black">
          <HeroFeature item={heroItem} />
        </section>
      )}

      {/* 2. Quick Navigation */}
      <QuickLinks />

      {/* 3. ONE Masonry Grid - ALL content types mixed */}
      {allGridItems.length > 0 && (
        <MasonryContentGrid items={allGridItems} />
      )}

      {/* 4. Echo Spotlight - AI Music Expert */}
      <EchoSpotlight />

      {/* 5. Product Banner */}
      <ProductBanner />

      {/* 7. Shop Categories Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
