import React from 'react';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
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
