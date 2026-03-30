import { NederlandHero } from "@/components/nederland/NederlandHero";
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { NederlandseMuziekQuiz } from "@/components/nederland/NederlandseMuziekQuiz";
import { DecenniumSlider } from "@/components/nederland/DecenniumSlider";
import { NederlandseSingles } from "@/components/nederland/NederlandseSingles";
import { DutchArtistSpotlight } from "@/components/nederland/DutchArtistSpotlight";
import { NederlandseArtiesten } from "@/components/nederland/NederlandseArtiesten";
import { NederlandseVerhalen } from "@/components/nederland/NederlandseVerhalen";
import { DualViewNLTijdlijn } from "@/components/nederland/DualViewNLTijdlijn";
import { NederlandseGenres } from "@/components/nederland/NederlandseGenres";

const NederlandseMuziek = () => {
  const pageUrl = "https://vinylplaten.nl/nederland";
  const pageTitle = "Nederlandse Muziek — Artiesten, Albums & Verhalen | MusicScan";
  const pageDescription = "Ontdek Nederlandse muziek van Golden Earring tot Tiësto. Quiz, interactieve kaart, artiesten per provincie en 60 jaar muziekgeschiedenis.";
  const ogImage = "https://vinylplaten.nl/og-nederland-muziek.jpg";

  // Structured Data - CollectionPage with ItemList
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": pageUrl,
    "inLanguage": "nl-NL",
    "isPartOf": {
      "@type": "WebSite",
      "name": "VinylPlaten.nl",
      "url": "https://vinylplaten.nl"
    },
    "about": {
      "@type": "Thing",
      "name": "Nederlandse Muziek",
      "description": "Muziek uit Nederland, van nederpop tot EDM"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Nederlandse Artiesten",
      "numberOfItems": 50,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Golden Earring", "url": "https://vinylplaten.nl/artists/golden-earring" },
        { "@type": "ListItem", "position": 2, "name": "Within Temptation", "url": "https://vinylplaten.nl/artists/within-temptation" },
        { "@type": "ListItem", "position": 3, "name": "André Hazes", "url": "https://vinylplaten.nl/artists/andre-hazes" },
        { "@type": "ListItem", "position": 4, "name": "Tiësto", "url": "https://vinylplaten.nl/artists/tiesto" },
        { "@type": "ListItem", "position": 5, "name": "Marco Borsato", "url": "https://vinylplaten.nl/artists/marco-borsato" }
      ]
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vinylplaten.nl" },
      { "@type": "ListItem", "position": 2, "name": "Landen", "item": "https://vinylplaten.nl/landen" },
      { "@type": "ListItem", "position": 3, "name": "Nederland", "item": pageUrl }
    ]
  };

  // FAQ Schema for common questions
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Wie zijn de bekendste Nederlandse artiesten?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "De bekendste Nederlandse artiesten zijn onder andere Golden Earring, Within Temptation, André Hazes, Tiësto, Armin van Buuren, Martin Garrix, Marco Borsato, Anouk en Doe Maar."
        }
      },
      {
        "@type": "Question",
        "name": "Welke muziekgenres komen uit Nederland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nederland is bekend om diverse genres zoals nederpop, levenslied, symphonic metal (Within Temptation, Epica), EDM/trance (Tiësto, Armin van Buuren), Dutch house en gabber."
        }
      },
      {
        "@type": "Question",
        "name": "Welke Nederlandse band had een wereldhit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Golden Earring scoorde een wereldhit met 'Radar Love' (1973). Shocking Blue bereikte #1 in de VS met 'Venus' (1969). Focus had internationaal succes met 'Hocus Pocus'."
        }
      }
    ]
  };

  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
<main className="min-h-screen">
        {/* H1 is in NederlandHero component */}
        <NederlandHero />

        <NederlandseMuziekQuiz />

        <DecenniumSlider />

        <NederlandseSingles />

        

        <DutchArtistSpotlight />

        <NederlandseArtiesten />

        <NederlandseVerhalen />

        <DualViewNLTijdlijn />

        <NederlandseGenres />
      </main>
    </>
  );
};

export default NederlandseMuziek;
