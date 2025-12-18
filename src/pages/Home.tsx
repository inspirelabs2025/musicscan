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

    // Helper: get 1 random item from a pool of recent items (en nooit de hero dupliceren)
    // requireImage: filter alleen items met afbeelding
    const getRandomFromType = (type: string, poolSize: number = 5, requireImage = false) => {
      const pool = newsItems
        .filter(i => i.type === type && i.id !== excludedId && (!requireImage || i.image_url))
        .slice(0, poolSize);
      return shuffleArray(pool).slice(0, 1);
    };

    // NIEUWS: Pak alle 3 laatste nieuwsberichten
    const latestNews = newsItems.filter(i => i.type === 'news').slice(0, 3);

    // MUZIEKGESCHIEDENIS: altijd 1 item in de grid (fallback naar vaste kaart)
    const historyItem = (() => {
      const pick = getRandomFromType('history', 8);
      if (pick.length) return pick;
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

    // Andere types: random 1 uit pool van 5
    // Singles: ALLEEN met artwork (requireImage=true)
    const items = shuffleArray([
      ...getRandomFromType('single', 5, true), // Singles alleen met artwork
      ...getRandomFromType('artist'),
      ...getRandomFromType('album'),
      ...getRandomFromType('release'),
      ...getRandomFromType('youtube'),
      ...historyItem,
      ...getRandomFromType('product'),
      ...getRandomFromType('podcast'),
      ...getRandomFromType('concert'),
      ...getRandomFromType('metal_print'),
      ...getRandomFromType(artType), // Random poster OF canvas met ART label
      ...latestNews, // 3 nieuwsitems
      ...getRandomFromType('anecdote'),
      ...getRandomFromType('review'),
      ...getRandomFromType('fanwall', 5, true), // Fanwall alleen met afbeelding
      ...getRandomFromType('quiz'), // Quiz van de dag met vraag
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

      {/* 5. Community Stats */}
      <CommunityStats />

      {/* 6. Product Banner */}
      <ProductBanner />

      {/* 7. Shop Categories Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
