import { FrankrijkHero } from "@/components/frankrijk/FrankrijkHero";
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { FranseMuziekQuiz } from "@/components/frankrijk/FranseMuziekQuiz";
import { DecenniumSliderFR } from "@/components/frankrijk/DecenniumSliderFR";
import { FrenchArtistSpotlight } from "@/components/frankrijk/FrenchArtistSpotlight";
import { FranseArtiesten } from "@/components/frankrijk/FranseArtiesten";
import { FranseVerhalen } from "@/components/frankrijk/FranseVerhalen";
import { FranseReleases } from "@/components/frankrijk/FranseReleases";
import { DualViewFRTijdlijn } from "@/components/frankrijk/DualViewFRTijdlijn";
import { FranseGenres } from "@/components/frankrijk/FranseGenres";

const FranseMuziek = () => {
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Franse Muziek - MusicScan",
    "description": "Ontdek de rijke Franse muziekgeschiedenis: van Édith Piaf tot Daft Punk, van chanson tot French house.",
    "url": "https://www.musicscan.app/frankrijk",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Franse Muziek Collectie",
      "description": "Een uitgebreide collectie van Franse muziek, artiesten en verhalen",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Chanson Française",
          "description": "Klassieke Franse liedkunst"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "French House",
          "description": "Electronic dance muziek uit Frankrijk"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "French Touch",
          "description": "Ambient electronic pop"
        }
      ]
    },
    "about": {
      "@type": "Thing",
      "name": "Franse Muziek",
      "description": "Muziek uit Frankrijk inclusief chanson, French house, yé-yé en meer"
    }
  };

  return (
    <>
      <JsonLd data={structuredData} />
<main className="min-h-screen bg-background">
        <FrankrijkHero />
        <FranseMuziekQuiz />
        <DecenniumSliderFR />
        <FrenchArtistSpotlight />
        <FranseArtiesten />
        <FranseVerhalen />
        <FranseReleases />
        <DualViewFRTijdlijn />
        <FranseGenres />
      </main>
    </>
  );
};

export default FranseMuziek;
