import { lazy, Suspense } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useUnifiedNewsFeed } from '@/hooks/useUnifiedNewsFeed';
import { NewsHeroGrid } from '@/components/home/NewsHeroGrid';
import { NewsCategorySection } from '@/components/home/NewsCategorySection';
import { ProductBanner } from '@/components/home/ProductBanner';
import { ShopCategoriesFooter } from '@/components/home/ShopCategoriesFooter';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load below-fold components
const SpotifyNewReleasesSection = lazy(() => import('@/components/home/SpotifyNewReleasesSection').then(m => ({ default: m.SpotifyNewReleasesSection })));
const YouTubeDiscoveriesSection = lazy(() => import('@/components/home/YouTubeDiscoveriesSection').then(m => ({ default: m.YouTubeDiscoveriesSection })));
const PodcastSpotlight = lazy(() => import('@/components/home/PodcastSpotlight').then(m => ({ default: m.PodcastSpotlight })));
const MusicHistorySpotlight = lazy(() => import('@/components/home/MusicHistorySpotlight').then(m => ({ default: m.MusicHistorySpotlight })));
const DailyAnecdote = lazy(() => import('@/components/home/DailyAnecdote').then(m => ({ default: m.DailyAnecdote })));
const FeaturedPhotos = lazy(() => import('@/components/FeaturedPhotos').then(m => ({ default: m.FeaturedPhotos })));
const ReviewsSpotlight = lazy(() => import('@/components/home/ReviewsSpotlight').then(m => ({ default: m.ReviewsSpotlight })));
const CommunityStats = lazy(() => import('@/components/home/CommunityStats').then(m => ({ default: m.CommunityStats })));

// Lightweight skeleton for lazy-loaded sections
const SectionSkeleton = () => (
  <div className="py-8 md:py-12">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
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

  // Filter items by type for category sections
  const albumItems = newsItems?.filter(i => i.type === 'album') || [];
  const singleItems = newsItems?.filter(i => i.type === 'single') || [];
  const artistItems = newsItems?.filter(i => i.type === 'artist') || [];
  const anecdoteItems = newsItems?.filter(i => i.type === 'anecdote') || [];
  const reviewItems = newsItems?.filter(i => i.type === 'review') || [];

  // Hero gets a mix of newest items
  const heroItems = newsItems?.slice(0, 4) || [];

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
      {/* 1. Hero Grid - Mixed newest content */}
      <NewsHeroGrid items={heroItems} />

      {/* 2. Album Verhalen Section */}
      {albumItems.length > 0 && (
        <NewsCategorySection
          title="Album Verhalen"
          items={albumItems.slice(0, 5)}
          viewAllLink="/verhalen"
        />
      )}

      {/* 3. Nieuwe Releases - Horizontal Carousel */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50">
          <SpotifyNewReleasesSection />
        </section>
      </Suspense>

      {/* 4. Singles Section */}
      {singleItems.length > 0 && (
        <NewsCategorySection
          title="Singles"
          items={singleItems.slice(0, 5)}
          viewAllLink="/singles"
        />
      )}

      {/* 5. Product Banner - Subtle shop promotion */}
      <ProductBanner />

      {/* 6. Artiest Spotlights */}
      {artistItems.length > 0 && (
        <NewsCategorySection
          title="Artiest Spotlights"
          items={artistItems.slice(0, 5)}
          viewAllLink="/artists"
        />
      )}

      {/* 7. YouTube & Podcast Section */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Video Ontdekkingen</h2>
                <YouTubeDiscoveriesSection />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Podcast</h2>
                <PodcastSpotlight />
              </div>
            </div>
          </div>
        </section>
      </Suspense>

      {/* 8. Music History Timeline */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50">
          <MusicHistorySpotlight />
        </section>
      </Suspense>

      {/* 9. Anecdotes Section */}
      {anecdoteItems.length > 0 && (
        <NewsCategorySection
          title="Muziek Anekdotes"
          items={anecdoteItems.slice(0, 5)}
          viewAllLink="/anekdotes"
        />
      )}

      {/* 10. Daily Anecdote Spotlight */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50 bg-primary/5">
          <DailyAnecdote />
        </section>
      </Suspense>

      {/* 11. Community Section: FanWall + Reviews */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Community</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <FeaturedPhotos />
              </div>
              <div>
                <ReviewsSpotlight />
              </div>
            </div>
          </div>
        </section>
      </Suspense>

      {/* 12. Community Stats */}
      <Suspense fallback={<SectionSkeleton />}>
        <section className="py-8 md:py-12 border-t border-border/50 bg-muted/30">
          <CommunityStats />
        </section>
      </Suspense>

      {/* 13. Shop Categories Footer */}
      <ShopCategoriesFooter />
    </div>
  );
};

export default Home;
