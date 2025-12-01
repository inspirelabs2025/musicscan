import { Helmet } from "react-helmet";
import { NederlandHero } from "@/components/nederland/NederlandHero";
import { NederlandseArtiesten } from "@/components/nederland/NederlandseArtiesten";
import { NederlandseVerhalen } from "@/components/nederland/NederlandseVerhalen";
import { NederlandseReleases } from "@/components/nederland/NederlandseReleases";
import { NederlandseMuziekGeschiedenis } from "@/components/nederland/NederlandseMuziekGeschiedenis";
import { NederlandseGenres } from "@/components/nederland/NederlandseGenres";

const NederlandseMuziek = () => {
  return (
    <>
      <Helmet>
        <title>Nederlandse Muziek | Ontdek Nederlandse Artiesten & Albums</title>
        <meta 
          name="description" 
          content="Ontdek het beste van de Nederlandse muziekscene. Van Golden Earring tot Within Temptation, van nederpop tot symphonic metal. Albums, verhalen en releases uit Nederland." 
        />
        <meta 
          name="keywords" 
          content="Nederlandse muziek, Dutch music, Within Temptation, Golden Earring, André Hazes, Tiësto, nederpop, symphonic metal, Dutch artists" 
        />
        <link rel="canonical" href="https://vinylplaten.nl/nederland" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Nederlandse Muziek | Ontdek Nederlandse Artiesten & Albums" />
        <meta property="og:description" content="Ontdek het beste van de Nederlandse muziekscene. Van Golden Earring tot Within Temptation." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="nl_NL" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Nederlandse Muziek",
            "description": "Collectie van Nederlandse muziek, artiesten en albums",
            "url": "https://vinylplaten.nl/nederland",
            "inLanguage": "nl",
            "about": {
              "@type": "Country",
              "name": "Netherlands"
            },
            "mainEntity": {
              "@type": "MusicGroup",
              "name": "Nederlandse Artiesten",
              "description": "Collectie van Nederlandse muziekartiesten"
            }
          })}
        </script>
      </Helmet>

      <main className="min-h-screen">
        {/* 1. Hero Section */}
        <NederlandHero />

        {/* 2. Uitgelichte Nederlandse Artiesten */}
        <NederlandseArtiesten />

        {/* 3. Nederlandse Album Verhalen */}
        <NederlandseVerhalen />

        {/* 4. Nederlandse Releases */}
        <NederlandseReleases />

        {/* 5. Nederlandse Muziekgeschiedenis */}
        <NederlandseMuziekGeschiedenis />

        {/* 6. Genres in Nederland */}
        <NederlandseGenres />
      </main>
    </>
  );
};

export default NederlandseMuziek;
