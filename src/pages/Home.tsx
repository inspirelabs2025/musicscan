import { SimpleHero } from '@/components/home/SimpleHero';
import { QuickDiscoveryBar } from '@/components/home/QuickDiscoveryBar';
import { MetalPrintSpotlight } from '@/components/home/MetalPrintSpotlight';
import { ShopByCategorySection } from '@/components/shop/ShopByCategorySection';
import { FeaturedProductsCarousel } from '@/components/shop/FeaturedProductsCarousel';
import { NewsAndStoriesSection } from '@/components/home/NewsAndStoriesSection';
import { AIFeaturesCompact } from '@/components/home/AIFeaturesCompact';
import { CommunityStats } from '@/components/home/CommunityStats';
import { ConditionalFooter } from '@/components/ConditionalFooter';
import { useSEO } from '@/hooks/useSEO';

const Home = () => {
  useSEO({
    title: "Vinyl Verzamelaar - Scan, Ontdek & Deel je Muziekcollectie",
    description: "Scan je platen en cd's met AI, ontdek prijzen en verhalen, deel met de community. 10.000+ albums gescand. Start gratis!",
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Simple with 3 CTAs */}
      <SimpleHero />

      {/* Quick Discovery Bar */}
      <QuickDiscoveryBar />

      {/* Metal Print Spotlight - Prominent ART Section */}
      <MetalPrintSpotlight />

      {/* Shop Categories - Large Visual Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">🛍️ Onze Shop - Browse op Categorie</h2>
            <p className="text-xl text-muted-foreground">
              Van vintage vinyl tot moderne art prints
            </p>
          </div>
          <ShopByCategorySection />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">⭐ Uitgelichte Producten</h2>
            <p className="text-xl text-muted-foreground">
              Handpicked items uit onze collectie
            </p>
          </div>
          <FeaturedProductsCarousel />
        </div>
      </section>

      {/* News & Stories Section with Tabs */}
      <NewsAndStoriesSection />

      {/* AI Features - Compact */}
      <AIFeaturesCompact />

      {/* Community Stats */}
      <CommunityStats />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-vinyl-purple/20 via-vinyl-gold/20 to-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold">Klaar om te Beginnen?</h2>
            <p className="text-xl text-muted-foreground">
              Sluit je aan bij duizenden muziekliefhebbers en ontdek wat je collectie waard is
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/shop"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-vinyl-gold to-amber-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                🛍️ Browse Shop
              </a>
              <a
                href="/music-news"
                className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-transparent px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-all"
              >
                📰 Lees Nieuws
              </a>
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg border-2 border-vinyl-purple bg-transparent px-8 py-4 text-lg font-semibold text-vinyl-purple hover:bg-vinyl-purple/10 transition-all"
              >
                📸 Scan Gratis
              </a>
            </div>
          </div>
        </div>
      </section>

      <ConditionalFooter />
    </div>
  );
};

export default Home;
