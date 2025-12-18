import { lazy, Suspense } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { HeroFeature } from '@/components/home/HeroFeature';
import { QuickLinks } from '@/components/home/QuickLinks';
import { ContentGrid } from '@/components/home/ContentGrid';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { Skeleton } from '@/components/ui/skeleton';

const SpotifyNewReleasesSection = lazy(() => import('@/components/home/SpotifyNewReleasesSection').then(m => ({ default: m.SpotifyNewReleasesSection })));
const MusicHistorySpotlight = lazy(() => import('@/components/home/MusicHistorySpotlight').then(m => ({ default: m.MusicHistorySpotlight })));

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

const Home = () => {
  const { data: newsItems, isLoading } = useUnifiedNewsFeed(50);

  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  // Get exactly 1 item per type
  const getFirst = (type: string) => newsItems?.find(i => i.type === type);
  
  const albumItem = getFirst('album');
  const singleItem = getFirst('single');
  const artistItem = getFirst('artist');
  const youtubeItem = getFirst('youtube');
  const anecdoteItem = getFirst('anecdote');
  const reviewItem = getFirst('review');
  const historyItem = getFirst('history');
  const releaseItem = getFirst('release');

  // Hero = most recent item overall
  const heroItem = newsItems?.[0];

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

      {/* Content Grid - 1 item per category */}
      <ContentGrid 
        columns={4}
        items={[
          { title: 'Single', item: singleItem, viewAllLink: '/singles' },
          { title: 'Artiest', item: artistItem, viewAllLink: '/artists' },
          { title: 'Anekdote', item: anecdoteItem, viewAllLink: '/anekdotes' },
          { title: 'Nieuwe Release', item: releaseItem, viewAllLink: '/new-releases' },
        ]}
      />

      {/* Product Banner */}
      <ProductBanner />

      {/* More Content - 1 item per category */}
      <ContentGrid 
        columns={3}
        items={[
          { title: 'YouTube', item: youtubeItem, viewAllLink: '/youtube' },
          { title: 'Review', item: reviewItem, viewAllLink: '/reviews' },
          { title: 'Muziekgeschiedenis', item: historyItem, viewAllLink: '/vandaag-in-de-muziekgeschiedenis' },
        ]}
      />

      {/* Spotify Releases Carousel */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="bg-zinc-950 py-10 md:py-14">
          <div className="container mx-auto px-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
              Nieuwe Spotify Releases
            </h2>
          </div>
          <SpotifyNewReleasesSection />
        </section>
      </Suspense>

      {/* Music History */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="bg-background py-10 md:py-14">
          <MusicHistorySpotlight />
        </section>
      </Suspense>

      {/* Shop Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
