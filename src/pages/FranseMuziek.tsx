import { Helmet } from "react-helmet";
import { FrankrijkHero } from "@/components/frankrijk/FrankrijkHero";
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
    "url": "https://musicscan.nl/frankrijk",
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
      <Helmet>
        <title>Franse Muziek - Van Édith Piaf tot Daft Punk | MusicScan</title>
        <meta 
          name="description" 
          content="Ontdek de rijke Franse muziekgeschiedenis: van het klassieke chanson van Édith Piaf tot de elektronische beats van Daft Punk. Verken artiesten, albums en verhalen." 
        />
        <meta 
          name="keywords" 
          content="Franse muziek, Daft Punk, Édith Piaf, French House, chanson, Air, Phoenix, David Guetta, French Touch, Serge Gainsbourg" 
        />
        <link rel="canonical" href="https://musicscan.nl/frankrijk" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Franse Muziek - Van Édith Piaf tot Daft Punk | MusicScan" />
        <meta property="og:description" content="Ontdek de rijke Franse muziekgeschiedenis: van chanson tot French house." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://musicscan.nl/frankrijk" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Franse Muziek - Van Édith Piaf tot Daft Punk" />
        <meta name="twitter:description" content="Ontdek de rijke Franse muziekgeschiedenis bij MusicScan." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

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
