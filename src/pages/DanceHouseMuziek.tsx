import React from 'react';
import { Helmet } from 'react-helmet';
import { DanceHouseHero } from '@/components/dance-house/DanceHouseHero';
import { DanceHouseMuziekQuiz } from '@/components/dance-house/DanceHouseMuziekQuiz';
import { DecenniumSliderDH } from '@/components/dance-house/DecenniumSliderDH';
import { DanceHouseArtistSpotlight } from '@/components/dance-house/DanceHouseArtistSpotlight';
import { DanceHouseArtiesten } from '@/components/dance-house/DanceHouseArtiesten';
import { DanceHouseVerhalen } from '@/components/dance-house/DanceHouseVerhalen';
import { DanceHouseReleases } from '@/components/dance-house/DanceHouseReleases';
import { DualViewDHTijdlijn } from '@/components/dance-house/DualViewDHTijdlijn';
import { DanceHouseSubgenres } from '@/components/dance-house/DanceHouseSubgenres';

const DanceHouseMuziek = () => {
  const pageUrl = 'https://www.musicscan.app/dance-house';
  const pageTitle = 'Dance & House Muziek - Geschiedenis, Artiesten & Verhalen | MusicScan';
  const pageDescription = 'Ontdek de rijke geschiedenis van dance en house muziek. Van Chicago House tot moderne EDM, van Daft Punk tot Martin Garrix. Verhalen, tijdlijn en 100+ artiesten.';
  const ogImage = 'https://www.musicscan.app/og-dance-house.jpg';

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Dance & House Muziek",
    "description": pageDescription,
    "url": pageUrl,
    "mainEntity": {
      "@type": "ItemList",
      "name": "Dance & House Artiesten",
      "numberOfItems": 100,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Daft Punk" },
        { "@type": "ListItem", "position": 2, "name": "Tiësto" },
        { "@type": "ListItem", "position": 3, "name": "Martin Garrix" },
        { "@type": "ListItem", "position": 4, "name": "Carl Cox" },
        { "@type": "ListItem", "position": 5, "name": "Armin van Buuren" }
      ]
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.musicscan.app" },
      { "@type": "ListItem", "position": 2, "name": "Dance & House", "item": pageUrl }
    ]
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Waar komt house muziek vandaan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "House muziek is ontstaan in Chicago in de jaren '80, vernoemd naar de club 'The Warehouse' waar DJ Frankie Knuckles als resident draaide."
        }
      },
      {
        "@type": "Question",
        "name": "Wat is het verschil tussen house en techno?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "House heeft zijn oorsprong in Chicago en is vaak soulful en melodisch. Techno komt uit Detroit en is over het algemeen harder en meer industrieel van karakter."
        }
      },
      {
        "@type": "Question",
        "name": "Wie zijn de grootste Nederlandse DJ's?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nederland heeft veel invloedrijke DJ's voortgebracht, waaronder Tiësto, Armin van Buuren, Martin Garrix, Hardwell, Afrojack en Oliver Heldens."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="dance muziek, house muziek, techno, trance, EDM, electronic music, DJ, Daft Punk, Tiësto, Martin Garrix, Carl Cox, Armin van Buuren, Chicago house, Detroit techno" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqData)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <DanceHouseHero />
        <DanceHouseMuziekQuiz />
        <DecenniumSliderDH />
        <DanceHouseArtistSpotlight />
        <DanceHouseArtiesten />
        <DanceHouseVerhalen />
        <DanceHouseReleases />
        <DualViewDHTijdlijn />
        <DanceHouseSubgenres />
      </main>
    </>
  );
};

export default DanceHouseMuziek;
