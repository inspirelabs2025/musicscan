import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { ContentGrid } from '@/components/home/ContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { Skeleton } from '@/components/ui/skeleton';

const SectionSkeleton = () => (
  <div className="py-10 bg-background">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="aspect-[4/3]" />
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
  const { data: newsItems, isLoading } = useUnifiedNewsFeed(50);

  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  // Get exactly 1 item per type
  const getFirst = (type: string) => newsItems?.find(i => i.type === type);
  
  // All content types as equal news items
  const allItems = [
    { title: 'Single', item: getFirst('single'), viewAllLink: '/singles' },
    { title: 'Artiest', item: getFirst('artist'), viewAllLink: '/artists' },
    { title: 'Anekdote', item: getFirst('anecdote'), viewAllLink: '/anekdotes' },
    { title: 'Nieuwe Release', item: getFirst('release'), viewAllLink: '/new-releases' },
    { title: 'YouTube', item: getFirst('youtube'), viewAllLink: '/youtube' },
    { title: 'Review', item: getFirst('review'), viewAllLink: '/reviews' },
    { title: 'Muziekgeschiedenis', item: getFirst('history'), viewAllLink: '/vandaag-in-de-muziekgeschiedenis' },
    { title: 'Album Verhaal', item: getFirst('album'), viewAllLink: '/verhalen' },
  ];

  // Hero = most recent item overall
  const heroItem = newsItems?.[0];

  // Filter valid items and shuffle
  const validItems = allItems.filter(i => i.item);
  const shuffled = shuffleArray(validItems);
  
  // Distribute over sections
  const firstGrid = shuffled.slice(0, 4);
  const secondGrid = shuffled.slice(4, 7);
  const thirdGrid = shuffled.slice(7);

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

      {/* First Random Content Grid - 4 columns */}
      {firstGrid.length > 0 && (
        <ContentGrid columns={4} items={firstGrid} />
      )}

      {/* Product Banner */}
      <ProductBanner />

      {/* Second Random Content Grid - 3 columns */}
      {secondGrid.length > 0 && (
        <ContentGrid columns={3} items={secondGrid} />
      )}

      {/* Third Grid if there are remaining items */}
      {thirdGrid.length > 0 && (
        <ContentGrid 
          columns={thirdGrid.length as 2 | 3 | 4} 
          items={thirdGrid} 
        />
      )}

      {/* Shop Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
