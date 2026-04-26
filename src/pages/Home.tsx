import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { JsonLd } from '@/components/SEO/JsonLd';
import { useSEO } from '@/hooks/useSEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScannerHero } from '@/components/home/ScannerHero';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
import { SeoContentBlock } from '@/components/SEO/SeoContentBlock';

// Lazy load sections
const PopularSinglesSection = lazy(() => import('@/components/home/sections/PopularSinglesSection').then(m => ({ default: m.PopularSinglesSection })));
const ArtistsSection = lazy(() => import('@/components/home/sections/ArtistsSection').then(m => ({ default: m.ArtistsSection })));
const StoriesSection = lazy(() => import('@/components/home/sections/StoriesSection').then(m => ({ default: m.StoriesSection })));
const GenresSection = lazy(() => import('@/components/home/sections/GenresSection').then(m => ({ default: m.GenresSection })));
// CommunitySection verwijderd van homepage
const MagicMikeSection = lazy(() => import('@/components/home/sections/MagicMikeSection').then(m => ({ default: m.MagicMikeSection })));
const MagicMikePodcastSection = lazy(() => import('@/components/home/sections/MagicMikePodcastSection').then(m => ({ default: m.MagicMikePodcastSection })));
// ProductBanner verwijderd
const MobileInstallBanner = lazy(() => import('@/components/MobileInstallBanner').then(m => ({ default: m.MobileInstallBanner })));
const AppInstallBanner = lazy(() => import('@/components/home/AppInstallBanner').then(m => ({ default: m.AppInstallBanner })));

const SectionFallback = () => <div className="py-10"><Skeleton className="h-48 mx-4 rounded-xl" /></div>;

const Home = () => {
  const { tr } = useLanguage();
  const { user, signOut } = useAuth();

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
    <div className="min-h-screen bg-background pt-14">
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />

      {/* Hero */}
      <ScannerHero />

      {/* App Install Banner (mobile only) */}
      <Suspense fallback={null}>
        <AppInstallBanner />
      </Suspense>

      {/* Podcast */}
      <Suspense fallback={<SectionFallback />}>
        <MagicMikePodcastSection />
      </Suspense>

      <div className="py-2" />

      {/* Sectie 1: Populaire Singles */}
      <Suspense fallback={<SectionFallback />}>
        <PopularSinglesSection />
      </Suspense>

      <div className="py-2" />

      {/* Sectie 2: Artiesten */}
      <Suspense fallback={<SectionFallback />}>
        <ArtistsSection />
      </Suspense>

      <div className="py-2" />

      {/* Sectie 3: Album Verhalen & Anekdotes */}
      <Suspense fallback={<SectionFallback />}>
        <StoriesSection />
      </Suspense>

      <div className="py-2" />

      {/* Magic Mike */}
      <Suspense fallback={<SectionFallback />}>
        <MagicMikeSection />
      </Suspense>

      <div className="py-2" />

      {/* Sectie 4: Ontdek op Genre */}
      <Suspense fallback={<SectionFallback />}>
        <GenresSection />
      </Suspense>

      <div className="py-2" />

      {/* Sectie 5: Community sectie verwijderd */}

      {/* Shop sectie verwijderd */}

      {/* PWA Install */}
      <Suspense fallback={null}>
        <MobileInstallBanner />
      </Suspense>

      {/* SEO Content Block */}
      <SeoContentBlock text={tr.homeUI.seoBlock} />
    </div>
  );
};

export default Home;
