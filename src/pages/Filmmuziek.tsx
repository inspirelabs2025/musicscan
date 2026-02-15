import React from 'react';
import { Helmet } from 'react-helmet';
import { FilmmuziekHero } from '@/components/filmmuziek/FilmmuziekHero';
import { FilmmuziekQuiz } from '@/components/filmmuziek/FilmmuziekQuiz';
import { DecenniumSliderFM } from '@/components/filmmuziek/DecenniumSliderFM';
import { FilmmuziekArtistSpotlight } from '@/components/filmmuziek/FilmmuziekArtistSpotlight';
import { FilmmuziekArtiesten } from '@/components/filmmuziek/FilmmuziekArtiesten';
import { FilmmuziekVerhalen } from '@/components/filmmuziek/FilmmuziekVerhalen';
import { FilmmuziekReleases } from '@/components/filmmuziek/FilmmuziekReleases';
import { DualViewFMTijdlijn } from '@/components/filmmuziek/DualViewFMTijdlijn';
import { FilmmuziekSubgenres } from '@/components/filmmuziek/FilmmuziekSubgenres';
import { useLanguage } from '@/contexts/LanguageContext';

const Filmmuziek = () => {
  const { tr } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{tr.filmmuziek.title}</title>
        <meta name="description" content={tr.filmmuziek.description} />
        <meta name="keywords" content="filmmuziek, soundtracks, film scores, John Williams, Hans Zimmer, Ennio Morricone, filmcomponisten, orkestrale muziek" />
        <link rel="canonical" href="https://www.musicscan.app/filmmuziek" />
        <meta property="og:title" content={tr.filmmuziek.title} />
        <meta property="og:description" content={tr.filmmuziek.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.musicscan.app/filmmuziek" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={tr.filmmuziek.title} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Filmmuziek",
            "description": tr.filmmuziek.description,
            "url": "https://www.musicscan.app/filmmuziek"
          })}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <FilmmuziekHero />
        <FilmmuziekQuiz />
        <DecenniumSliderFM />
        <FilmmuziekArtistSpotlight />
        <FilmmuziekArtiesten />
        <FilmmuziekVerhalen />
        <FilmmuziekReleases />
        <DualViewFMTijdlijn />
        <FilmmuziekSubgenres />
      </main>
    </>
  );
};

export default Filmmuziek;
