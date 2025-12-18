import { lazy, Suspense } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { NewsHeroGrid } from '@/components/home/NewsHeroGrid';
import { NewsCategorySection } from '@/components/home/NewsCategorySection';
import { MediaGridSection } from '@/components/home/MediaGridSection';
import { CompactNewsList } from '@/components/home/CompactNewsList';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const SpotifyNewReleasesSection = lazy(() => import('@/components/home/SpotifyNewReleasesSection').then(m => ({ default: m.SpotifyNewReleasesSection })));
const MusicHistorySpotlight = lazy(() => import('@/components/home/MusicHistorySpotlight').then(m => ({ default: m.MusicHistorySpotlight })));

const SectionSkeleton = () => (
  <div className="py-10 bg-zinc-900">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6 bg-zinc-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48 bg-zinc-800" />
        <Skeleton className="h-48 bg-zinc-800" />
        <Skeleton className="h-48 bg-zinc-800" />
      </div>
    </div>
  </div>
);

const Home = () => {
  const { data: newsItems, isLoading } = useUnifiedNewsFeed(60);

  useSEO({
    title: "MusicScan - Hét Muziekplatform | Nieuws, Verhalen, Shop, Quiz & Smart Scanner",
    description: "MusicScan is hét complete muziekplatform. Ontdek muzieknieuws, lees verhalen over albums & artiesten, shop unieke muziekproducten, doe de quiz, en scan je vinyl & CD collectie met waardebepaling.",
  });

  // Filter items by type
  const albumItems = newsItems?.filter(i => i.type === 'album') || [];
  const singleItems = newsItems?.filter(i => i.type === 'single') || [];
  const artistItems = newsItems?.filter(i => i.type === 'artist') || [];
  const anecdoteItems = newsItems?.filter(i => i.type === 'anecdote') || [];
  const youtubeItems = newsItems?.filter(i => i.type === 'youtube') || [];
  const reviewItems = newsItems?.filter(i => i.type === 'review') || [];
  const historyItems = newsItems?.filter(i => i.type === 'history') || [];

  // Hero gets a diverse mix
  const heroItems = newsItems?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 1. Hero Grid - Dramatic dark section */}
      <NewsHeroGrid items={heroItems} />

      {/* 2. Album Verhalen - Light section */}
      {albumItems.length > 0 && (
        <NewsCategorySection
          title="Album Verhalen"
          items={albumItems.slice(0, 5)}
          viewAllLink="/verhalen"
          variant="default"
        />
      )}

      {/* 3. Product Banner - Purple accent */}
      <ProductBanner />

      {/* 4. Artiest Spotlights - Dark section */}
      {artistItems.length > 0 && (
        <NewsCategorySection
          title="Artiest Spotlights"
          items={artistItems.slice(0, 5)}
          viewAllLink="/artists"
          variant="dark"
        />
      )}

      {/* 5. Nieuwe Releases */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="bg-white py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-primary">
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tight">
                Nieuwe Releases
              </h2>
            </div>
          </div>
          <SpotifyNewReleasesSection />
        </section>
      </Suspense>

      {/* 6. Singles Section - Light */}
      {singleItems.length > 0 && (
        <NewsCategorySection
          title="Singles"
          items={singleItems.slice(0, 5)}
          viewAllLink="/singles"
          variant="default"
        />
      )}

      {/* 7. YouTube Videos - Dark Grid */}
      {youtubeItems.length > 0 && (
        <MediaGridSection
          title="Video Ontdekkingen"
          items={youtubeItems}
          viewAllLink="/youtube"
        />
      )}

      {/* 8. Music History */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="bg-white py-10 md:py-14">
          <MusicHistorySpotlight />
        </section>
      </Suspense>

      {/* 9. Sidebar-style sections */}
      <section className="bg-zinc-900 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CompactNewsList
              title="Anekdotes"
              items={anecdoteItems}
              viewAllLink="/anekdotes"
            />
            <CompactNewsList
              title="Reviews"
              items={reviewItems}
              viewAllLink="/reviews"
            />
            <CompactNewsList
              title="Muziekgeschiedenis"
              items={historyItems}
              viewAllLink="/vandaag-in-de-muziekgeschiedenis"
            />
          </div>
        </div>
      </section>

      {/* 10. Shop Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
