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

const Filmmuziek = () => {
  return (
    <>
      <Helmet>
        <title>Filmmuziek | Soundtracks & Scores - MusicScan</title>
        <meta name="description" content="Ontdek de wereld van filmmuziek: van John Williams tot Hans Zimmer. Leer over iconische scores, componisten en de geschiedenis van film soundtracks." />
        <meta name="keywords" content="filmmuziek, soundtracks, film scores, John Williams, Hans Zimmer, Ennio Morricone, filmcomponisten, orkestrale muziek" />
        <link rel="canonical" href="https://www.musicscan.nl/filmmuziek" />
        <meta property="og:title" content="Filmmuziek | Soundtracks & Scores - MusicScan" />
        <meta property="og:description" content="Ontdek de wereld van filmmuziek: van John Williams tot Hans Zimmer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.musicscan.nl/filmmuziek" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Filmmuziek | Soundtracks & Scores - MusicScan" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Filmmuziek",
            "description": "Complete gids over filmmuziek, soundtracks en componisten",
            "url": "https://www.musicscan.nl/filmmuziek"
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
