import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { useSEO } from '@/hooks/useSEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScannerHero } from '@/components/home/ScannerHero';
import { Skeleton } from '@/components/ui/skeleton';
import { SeoContentBlock } from '@/components/SEO/SeoContentBlock';

const PopularSinglesSection = lazy(() => import('@/components/home/sections/PopularSinglesSection').then(m => ({ default: m.PopularSinglesSection })));
const ArtistsSection = lazy(() => import('@/components/home/sections/ArtistsSection').then(m => ({ default: m.ArtistsSection })));
const StoriesSection = lazy(() => import('@/components/home/sections/StoriesSection').then(m => ({ default: m.StoriesSection })));
const GenresSection = lazy(() => import('@/components/home/sections/GenresSection').then(m => ({ default: m.GenresSection })));
const CommunitySection = lazy(() => import('@/components/home/sections/CommunitySection').then(m => ({ default: m.CommunitySection })));
const MagicMikePodcastSection = lazy(() => import('@/components/home/sections/MagicMikePodcastSection').then(m => ({ default: m.MagicMikePodcastSection })));
const ProductBanner = lazy(() => import('@/components/home/ProductBanner').then(m => ({ default: m.ProductBanner })));
const MobileInstallBanner = lazy(() => import('@/components/MobileInstallBanner').then(m => ({ default: m.MobileInstallBanner })));

const SectionFallback = () => (
  <div className="py-8 md:py-16">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <Skeleton className="h-32 md:h-48 rounded-xl" />
    </div>
  </div>
);

const Home = () => {
  const { tr } = useLanguage();

  useSEO({
    title: tr.home.metaTitle,
    description: tr.home.metaDesc,
  });

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MusicScan",
    "url": "https://www.musicscan.app",
    "description": "Scan je vinyl en CD collectie, ontdek de waarde van je platen, lees verhalen achter iconische albums.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.musicscan.app/verhalen?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "nl"
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MusicScan",
    "url": "https://www.musicscan.app",
    "logo": "https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png",
    "description": "MusicScan is hét muziekplatform voor vinyl- en CD-verzamelaars.",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Dutch", "English"]
    },
    "sameAs": ["https://www.facebook.com/musicscan"]
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-14">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </Helmet>

      <ScannerHero />
      <div className="mt-6" />

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <PopularSinglesSection />
        </Suspense>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <ArtistsSection />
        </Suspense>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <StoriesSection />
        </Suspense>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <GenresSection />
        </Suspense>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <CommunitySection />
        </Suspense>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionFallback />}>
          <MagicMikePodcastSection />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <ProductBanner />
      </Suspense>

      <Suspense fallback={null}>
        <MobileInstallBanner />
      </Suspense>

      <SeoContentBlock text="MusicScan is hét muziekplatform voor vinyl- en CD-verzamelaars. Scan je platen met onze AI-scanner en ontdek direct de artiest, het album en de marktwaarde. Lees de verhalen achter iconische albums, test je muziekkennis met de dagelijkse quiz, en shop unieke album art producten zoals metal prints en canvas doeken. Of je nu vinyl wilt scannen, je collectie wilt beheren of gewoon muziekverhalen wilt lezen — bij MusicScan vind je alles." />
    </div>
  );
};

export default Home;
