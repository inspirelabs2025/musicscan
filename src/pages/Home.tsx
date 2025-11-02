import { InteractiveHero } from '@/components/home/InteractiveHero';
import { QuickDiscoveryBar } from '@/components/home/QuickDiscoveryBar';
import { LiveActivityFeed } from '@/components/home/LiveActivityFeed';
import { FeaturedContentGrid } from '@/components/home/FeaturedContentGrid';
import { TrendingAlbums } from '@/components/home/TrendingAlbums';
import { FeaturedProductsCarousel } from '@/components/shop/FeaturedProductsCarousel';
import { NewsSection } from '@/components/NewsSection';
import { ConditionalFooter } from '@/components/ConditionalFooter';
import { useSEO } from '@/hooks/useSEO';

const Home = () => {
  useSEO({
    title: "Vinyl Verzamelaar - Scan, Ontdek & Deel je Muziekcollectie",
    description: "Scan je platen en cd's met AI, ontdek prijzen en verhalen, deel met de community. 10.000+ albums gescand. Start gratis!",
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <InteractiveHero />

      {/* Quick Discovery Bar */}
      <QuickDiscoveryBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Live Activity & Stats */}
        <section>
          <LiveActivityFeed />
        </section>

        {/* Featured Content Grid */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Uitgelicht</h2>
            <p className="text-muted-foreground">
              Het beste van verhalen, discussies en vondsten
            </p>
          </div>
          <FeaturedContentGrid />
        </section>

        {/* Trending Albums */}
        <section>
          <TrendingAlbums />
        </section>

        {/* Shop Products */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Ontdek de Shop</h2>
            <p className="text-muted-foreground">
              Zeldzame vondsten en limited editions
            </p>
          </div>
          <FeaturedProductsCarousel />
        </section>

        {/* News & Updates */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Laatste Nieuws</h2>
            <p className="text-muted-foreground">
              Blijf op de hoogte van de muziekwereld
            </p>
          </div>
          <NewsSection compact={true} />
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vinyl-purple/20 via-vinyl-gold/20 to-accent/20 p-12 text-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold">Klaar om te Beginnen?</h2>
            <p className="text-lg text-muted-foreground">
              Sluit je aan bij duizenden verzamelaars en ontdek wat je collectie waard is
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Start Gratis
              </a>
              <a
                href="/shop"
                className="inline-flex items-center justify-center rounded-lg border-2 border-vinyl-gold bg-transparent px-8 py-4 text-lg font-semibold text-vinyl-gold hover:bg-vinyl-gold/10 transition-all"
              >
                Browse Shop
              </a>
            </div>
            <div className="flex gap-8 justify-center text-sm text-muted-foreground pt-6">
              <div>
                <p className="text-2xl font-bold text-foreground">10.000+</p>
                <p>Albums Gescand</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">1.000+</p>
                <p>Verhalen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">50+</p>
                <p>Actieve Shops</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConditionalFooter />
    </div>
  );
};

export default Home;
