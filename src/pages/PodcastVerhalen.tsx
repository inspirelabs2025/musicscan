import { Link } from "react-router-dom";
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/SEO/JsonLd';
import { Headphones, ExternalLink, Music, MapPin, Users, Disc3, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ── Artwork map (real data from Supabase music_stories / artist_stories) ── */
const ARTWORK: Record<string, { url: string; alt: string; storySlug?: string }> = {
  frankBoeijen: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/6b2d45ca-30c8-439b-88ce-d17c04d39ede-official.png',
    alt: 'Frank Boeijen Groep – Kronenburg Park',
    storySlug: '/muziek-verhaal/frank-boeijen-groep-kronenburg-park',
  },
  frankBoeijenZeg: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/171a607b-87fa-4847-a2b5-33cbafcc0b22-official.png',
    alt: 'Frank Boeijen Groep – Zeg Me Dat Het Niet Zo Is',
    storySlug: '/muziek-verhaal/frank-boeijen-groep-zeg-me-dat-het-niet-zo-is',
  },
  robDeNijs: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/a7e5a368-2e41-41bb-bc27-ad605f3f9738-official.png',
    alt: 'Rob de Nijs – Blauwe Dag',
    storySlug: '/muziek-verhaal/rob-de-nijs-blauwe-dag',
  },
  liesbethList: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/99cb2df1-c509-49ad-bf81-9450c6ac5742-official.png',
    alt: 'Liesbeth List & Ramses Shaffy – Pastorale',
    storySlug: '/muziek-verhaal/liesbeth-list-ramses-shaffy-pastorale',
  },
  beatles: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/a0b6265e-4b92-45cb-9d9a-84f4af789c96-official.png',
    alt: 'The Beatles – Here Comes The Sun',
    storySlug: '/muziek-verhaal/the-beatles-here-comes-the-sun',
  },
  doors: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/6289b89e-3861-4f47-9537-d353ccb0fc6a-official.png',
    alt: 'The Doors – Riders On The Storm',
    storySlug: '/muziek-verhaal/the-doors-riders-on-the-storm-albumversie',
  },
  animals: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/1d95e2f5-38b4-4b07-a379-34d29f4506f4-official.png',
    alt: 'Animals – House Of The Rising Sun',
    storySlug: '/muziek-verhaal/animals-house-of-the-rising-sun',
  },
  keane: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/954d0db7-f21b-4f9f-9f56-62c7b2aa4bb5-official.png',
    alt: 'Keane – Somewhere Only We Know',
    storySlug: '/muziek-verhaal/keane-somewhere-only-we-know',
  },
  eltonJohn: {
    url: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/vinyl_images/artwork/bfa0e8f5-f490-4376-93bb-10b08d991e6a-official.png',
    alt: 'Elton John – Your Song',
    storySlug: '/muziek-verhaal/elton-john-your-song',
  },
};

function ArticleImage({ artworkKey, className = '' }: { artworkKey: keyof typeof ARTWORK; className?: string }) {
  const art = ARTWORK[artworkKey];
  if (!art) return null;

  const img = (
    <figure className={`my-6 ${className}`}>
      <div className="overflow-hidden rounded-lg shadow-lg shadow-black/30 border border-primary/10 max-w-xs mx-auto md:mx-0">
        <img
          src={art.url}
          alt={art.alt}
          loading="lazy"
          className="w-full aspect-square object-cover"
        />
      </div>
      <figcaption className="text-xs text-muted-foreground mt-2 text-center md:text-left max-w-xs mx-auto md:mx-0">
        {art.alt}
      </figcaption>
    </figure>
  );

  if (art.storySlug) {
    return <Link to={art.storySlug} className="block hover:opacity-90 transition-opacity">{img}</Link>;
  }
  return img;
}

function ArtistLink({ name, slug }: { name: string; slug?: string }) {
  if (slug) {
    return (
      <Link to={slug} className="text-primary hover:underline font-semibold">
        {name}
      </Link>
    );
  }
  return <span className="font-semibold text-card-dark-foreground">{name}</span>;
}

const PAGE_URL = 'https://www.musicscan.app/podcasts/het-verhaal-achter-de-podcast';
const PAGE_TITLE = 'Het Verhaal Achter Winter in Hamburg - Frank Boeijen | De Plaat en het Verhaal Podcast | MusicScan';
const PAGE_DESC = 'Ontdek de muzikale reis achter de podcast aflevering over Winter in Hamburg van Frank Boeijen. Van Nijmegen naar Hamburg, via Rob de Nijs, Liesbeth List, The Beatles, The Animals, The Doors en Elton John. Beluister S1E6 van De Plaat en het Verhaal.';
const OG_IMAGE = ARTWORK.frankBoeijenZeg.url;
const ARTISTS_TAGS = ['Frank Boeijen', 'Rob de Nijs', 'Liesbeth List', 'Charles Aznavour', 'Whitney Houston', 'Ilse de Lange', 'Keane', 'The Beatles', 'The Animals', 'The Doors', 'Elton John', 'Bob Dylan', 'Neil Young'];

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: PAGE_TITLE,
    description: PAGE_DESC,
    image: OG_IMAGE,
    url: PAGE_URL,
    datePublished: '2025-06-01',
    dateModified: '2025-06-15',
    author: { '@type': 'Organization', name: 'MusicScan', url: 'https://www.musicscan.app' },
    publisher: {
      '@type': 'Organization',
      name: 'MusicScan',
      url: 'https://www.musicscan.app',
      logo: { '@type': 'ImageObject', url: 'https://www.musicscan.app/og-image.png' },
    },
    mainEntityOfPage: PAGE_URL,
    articleSection: 'Muziek',
    keywords: 'Frank Boeijen, Winter in Hamburg, Welkom in Utopia, podcast, muziekverhaal, Rob de Nijs, Liesbeth List, The Beatles Hamburg, The Doors, Keane, Elton John, De Plaat en het Verhaal, MusicScan, Nederlandse muziek, Top 2000',
    inLanguage: 'nl',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.musicscan.app' },
      { '@type': 'ListItem', position: 2, name: 'Podcasts', item: 'https://www.musicscan.app/podcasts' },
      { '@type': 'ListItem', position: 3, name: 'Het Verhaal Achter de Podcast', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: 'Winter in Hamburg – Frank Boeijen',
    description: PAGE_DESC,
    url: 'https://www.deplaathetverhaal.nl/episodes/episode/3f2840e9/podcast-winter-in-hamburg-van-frank-boeijen-groep',
    episodeNumber: 6,
    partOfSeason: { '@type': 'PodcastSeason', seasonNumber: 1 },
    partOfSeries: { '@type': 'PodcastSeries', name: 'De Plaat en het Verhaal', url: 'https://www.deplaathetverhaal.nl' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Waar gaat Winter in Hamburg over?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Winter in Hamburg is een nummer van Frank Boeijen van het album Welkom in Utopia (1987). De zanger is gedurende de winter met zijn geliefde op vakantie in Hamburg. De song staat sinds 2009 in de NPO Radio 2 Top 2000.',
        },
      },
      {
        '@type': 'Question',
        name: 'Wie is Frank Boeijen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Frank Boeijen is een Nederlandse zanger, dichter en componist uit Nijmegen. Hij richtte de Frank Boeijen Groep op die elf albums uitbracht met hits als Linda, Zwart-Wit en Zeg me dat het niet zo is.',
        },
      },
      {
        '@type': 'Question',
        name: 'Welke artiesten komen in deze podcast aflevering aan bod?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In deze aflevering komen onder andere Frank Boeijen, Rob de Nijs, Liesbeth List, Charles Aznavour, Whitney Houston, Ilse de Lange, Keane, The Beatles, The Animals, The Doors en Elton John aan bod.',
        },
      },
    ],
  },
];

export default function PodcastVerhalen() {
  return (
    <>
      {structuredData.map((sd, i) => <JsonLd key={i} data={sd} />)}
<div className="min-h-screen">
        {/* Hero with album cover */}
        <section className="relative overflow-hidden bg-card-dark py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Hero album cover */}
              <div className="shrink-0">
                <Link to="/muziek-verhaal/frank-boeijen-groep-kronenburg-park" className="block hover:opacity-90 transition-opacity">
                  <div className="w-48 h-48 md:w-56 md:h-56 overflow-hidden rounded-xl shadow-2xl shadow-primary/20 border border-primary/20 rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                    <img
                      src={ARTWORK.frankBoeijenZeg.url}
                      alt="Frank Boeijen Groep"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              </div>

              {/* Hero text */}
              <div className="text-center md:text-left">
                <Badge className="bg-primary/20 text-primary mb-4 text-xs">
                  De Plaat en het Verhaal — S1E6
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-card-dark-foreground mb-4">
                  Winter in Hamburg
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mb-2">
                  De muzikale reis van <ArtistLink name="Frank Boeijen" /> — van Nijmegen naar Hamburg, via <ArtistLink name="Rob de Nijs" />, <ArtistLink name="Liesbeth List" />, <ArtistLink name="The Beatles" /> en <ArtistLink name="The Doors" />
                </p>
                <p className="text-sm text-muted-foreground italic">
                  Onderdeel van de serie "Het Verhaal Achter de Podcast"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="bg-card-dark">
          <div className="container mx-auto px-6 max-w-3xl py-12 md:py-16">

            {/* ── De Song ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Disc3 className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">De Song: Winter in Hamburg</h2>
              </div>
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <p>
                  <em>Winter in Hamburg</em> is geschreven en geproduceerd door <ArtistLink name="Frank Boeijen" />. In het nummer is de zanger gedurende de winter met zijn geliefde op vakantie in Hamburg. De song verscheen op het album <strong>Welkom in Utopia</strong> (1987) en staat sinds 2009 in de <strong>NPO Radio 2 Top 2000</strong>, met als hoogste notering positie #1158 in 2014.
                </p>
                <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg px-5 py-4 my-6">
                  <p className="italic text-card-dark-foreground/90 text-base">
                    "Met het hoofd in de lucht, in dit schaamteloze land"
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Een bijzondere tekstregel — zeker in een tijd dat de Berlijnse Muur nog overeind stond. Hamburg lag vlak bij de grens met Oost-Duitsland. Die spanning tussen oost en west resoneerde in het nummer.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── Over Frank Boeijen ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Mic2 className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">Over Frank Boeijen</h2>
              </div>

              <div className="md:flex md:gap-6">
                <div className="md:shrink-0">
                  <ArticleImage artworkKey="frankBoeijen" />
                </div>
                <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                  <p>
                    <ArtistLink name="Frank Boeijen" /> — Nederlandse zanger, dichter en componist uit Nijmegen. De jongste uit een gezin van tien kinderen. Zijn oudere broers brachten hem de muziek van <ArtistLink name="Bob Dylan" /> en <ArtistLink name="Neil Young" /> bij, een muzikale opvoeding die zijn hele carrière zou kleuren.
                  </p>
                  <p>
                    Via zijn broer ontmoette Frank de zeven jaar oudere <strong>Wout Pennings</strong>. In 1977 brachten ze samen een album uit in eigen beheer. Via Pennings belandde het materiaal bij platenmaatschappij <strong>CNR</strong>. Hier ontstaat ook de eerste connectie met <ArtistLink name="Rob de Nijs" /> — een draad die door het hele verhaal van deze aflevering loopt.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg mt-4">
                <p>
                  In 1979 gingen Pennings en Boeijen uit elkaar en richtte Frank de <strong>Frank Boeijen Groep</strong> op. De eerste single <em>Transport uit Bangkok</em> werd geen succes, maar de b-kant <em>Verjaardagsfeest</em> trok in 1981 de aandacht van <strong>Frits Spits</strong> — een moment dat alles veranderde.
                </p>
                <p>
                  De Frank Boeijen Groep bracht maar liefst elf albums uit, waaronder:
                </p>
                <ul className="list-none space-y-2 pl-4">
                  {[
                    { year: '1983', title: '1001 Hotel' },
                    { year: '1984', title: 'Kontakt' },
                    { year: '1985', title: 'Foto Van Een Mooie Dag' },
                    { year: '1986', title: 'In Natura' },
                    { year: '1987', title: 'Welkom In Utopia' },
                  ].map((album) => (
                    <li key={album.title} className="flex items-center gap-3">
                      <span className="text-xs text-primary font-mono bg-primary/10 rounded px-2 py-0.5">{album.year}</span>
                      <span className="font-medium text-card-dark-foreground">{album.title}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Hits als <em>Linda</em>, <em>Zwart-Wit</em> en <em>Zeg me dat het niet zo is</em> maakten de band tot een vaste waarde in de Nederlandse muziek. In 1991 ging de band uit elkaar en ging Frank solo verder.
                </p>
              </div>
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── Covers en Duetten ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">Covers en Duetten</h2>
              </div>

              {/* Rob de Nijs */}
              <h3 className="text-xl font-bold text-card-dark-foreground mt-6 mb-3">Rob de Nijs</h3>
              <div className="md:flex md:gap-6">
                <div className="md:shrink-0">
                  <ArticleImage artworkKey="robDeNijs" />
                </div>
                <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                  <p>
                    De connectie tussen Frank Boeijen en <ArtistLink name="Rob de Nijs" /> gaat diep. Samen zongen ze <em>Zwart-Wit</em>. Frank schreef nummers voor Rob, waaronder <em>Huis in de Zon</em>. Rob de Nijs bracht <em>Kronenburg Park</em> uit als single — een nummer dat onlosmakelijk met Frank Boeijen verbonden is.
                  </p>
                </div>
              </div>

              {/* Liesbeth List */}
              <h3 className="text-xl font-bold text-card-dark-foreground mt-10 mb-3">Liesbeth List</h3>
              <div className="md:flex md:gap-6">
                <div className="md:shrink-0">
                  <ArticleImage artworkKey="liesbethList" />
                </div>
                <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                  <p>
                    <ArtistLink name="Liesbeth List" /> — Frank hielp haar carrière weer op gang. Hij produceerde haar album <em>List</em>, dat een groot succes werd dankzij de single <em>De Verzoening</em>. Met <em>Noach</em> en <em>Vergezicht</em> bevestigde ze haar terugkeer. <em>Heb het Leven Lief</em> werd een ware klassieker.
                  </p>
                  <p>
                    Liesbeth maakte ook een bijzonder duet met <ArtistLink name="Charles Aznavour" /> — opvallend omdat Aznavour daarin in het Engels zong, iets wat hij zelden deed. Ze maakte ook een duet met <ArtistLink name="Whitney Houston" /> op de Nederlandse televisie — een onvergetelijk moment in de Nederlandse muziekgeschiedenis.
                  </p>
                </div>
              </div>

              {/* Ilse de Lange */}
              <h3 className="text-xl font-bold text-card-dark-foreground mt-10 mb-3">Ilse de Lange</h3>
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <p>
                  <ArtistLink name="Ilse de Lange" /> zong een prachtige versie van <em>Zwart-Wit</em> met Frank. Van Ilse leidt het spoor terug naar <ArtistLink name="Rob de Nijs" />: samen vertolkten ze <em>Het Dorp</em> van <strong>Wim Sonneveld</strong>.
                </p>
                <p>
                  En van Ilse de Lange komt de volgende connectie — via haar cover van <em>Somewhere Only We Know</em> belanden we bij <ArtistLink name="Keane" />.
                </p>
              </div>
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── De connectie met Hamburg ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">De connectie met Hamburg</h2>
              </div>

              <div className="md:flex md:gap-6">
                <div className="md:shrink-0">
                  <ArticleImage artworkKey="beatles" />
                </div>
                <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                  <p>
                    <ArtistLink name="Keane" /> deed een eigen nummer over dezelfde stad: <em>Hamburg Song</em>. Zo komen we bij het Hamburg van de jaren '60 — een stad die een cruciale rol speelde in de popgeschiedenis.
                  </p>
                  <p>
                    <ArtistLink name="The Beatles" /> speelden tussen 1960 en 1962 regelmatig in clubs in Hamburg — de <strong>Top Ten Club</strong> en <strong>The Star Club</strong>. De originele line-up bestond uit John Lennon, Paul McCartney, George Harrison, Stuart Sutcliffe en Pete Best. Ze reisden met een bus naar Hamburg.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg mt-4">
                <p>
                  Het liep niet altijd even soepel: Harrison werd gedeporteerd omdat hij minderjarig was. McCartney en Best werden gearresteerd. In Hamburg ontmoetten de Beatles de fotografe <strong>Astrid Kirchherr</strong>, die hun iconische look mede vormgaf.
                </p>
                <p>
                  <strong>Brian Epstein</strong> stuurde de band naar Hamburg na eerder succes met <strong>Derry and the Seniors</strong>. Na hun split vormde Derry Wilkie de band <em>Derry Wilkie and the Others</em>, die zij aan zij stonden in de <strong>Marquee Club</strong> in Londen met <strong>The Alan Price Set</strong>. Alan Price was de oprichter van <ArtistLink name="The Animals" />.
                </p>
              </div>
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── De connectie met The Doors ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Music className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">De connectie met The Doors</h2>
              </div>

              <div className="md:flex md:gap-6">
                <div className="md:shrink-0 md:order-2">
                  <ArticleImage artworkKey="doors" />
                </div>
                <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg md:order-1">
                  <p>
                    <ArtistLink name="The Animals" /> brengt ons bij <ArtistLink name="The Doors" />. Het is Jim Morrison zelf die de connectie legt:
                  </p>
                  <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg px-5 py-4 my-6">
                    <p className="italic text-card-dark-foreground/90 text-base">
                      "When we were first forming the Doors, the Animals were sort of a model for us. They had a similar instrumentation, with the organ, guitar and a great voice."
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">— Jim Morrison</p>
                  </div>
                  <p>
                    De bezetting van The Animals — met orgel, gitaar en een krachtige stem — was de directe inspiratie voor de sound die The Doors zouden ontwikkelen. Zonder The Animals, geen Doors zoals we ze kennen.
                  </p>
                </div>
              </div>

              {/* Animals cover inline */}
              <ArticleImage artworkKey="animals" />
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── Keane en Elton John ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Music className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">Keane en Elton John</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mb-6">
                <Link to="/muziek-verhaal/keane-somewhere-only-we-know" className="block hover:opacity-90 transition-opacity">
                  <div className="overflow-hidden rounded-lg shadow-lg shadow-black/30 border border-primary/10">
                    <img src={ARTWORK.keane.url} alt={ARTWORK.keane.alt} loading="lazy" className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Keane</p>
                </Link>
                <Link to="/muziek-verhaal/elton-john-your-song" className="block hover:opacity-90 transition-opacity">
                  <div className="overflow-hidden rounded-lg shadow-lg shadow-black/30 border border-primary/10">
                    <img src={ARTWORK.eltonJohn.url} alt={ARTWORK.eltonJohn.alt} loading="lazy" className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Elton John</p>
                </Link>
              </div>

              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <p>
                  De cirkel sluit bij <ArtistLink name="Keane" /> en <ArtistLink name="Elton John" />. Keane coverde <em>Goodbye Yellow Brick Road</em> en speelde live <em>Your Song</em>. <ArtistLink name="Elton John" /> was altijd een grote inspiratiebron voor de band — de piano-gedreven sound, de emotie in de melodieën.
                </p>
                <p>
                  En zo eindigt de muzikale reis van deze aflevering: van <ArtistLink name="Frank Boeijen" /> in Nijmegen, via <ArtistLink name="Rob de Nijs" />, <ArtistLink name="Liesbeth List" />, <ArtistLink name="Ilse de Lange" /> en <ArtistLink name="Keane" />, langs het Hamburg van <ArtistLink name="The Beatles" />, door <ArtistLink name="The Animals" /> naar <ArtistLink name="The Doors" />, en terug bij <ArtistLink name="Elton John" />.
                </p>
              </div>
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── Artiesten op de reis ── */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-card-dark-foreground mb-4">Alle artiesten op de reis</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  'Frank Boeijen', 'Rob de Nijs', 'Liesbeth List', 'Charles Aznavour',
                  'Whitney Houston', 'Ilse de Lange', 'Keane', 'The Beatles',
                  'Eric Clapton', 'The Animals', 'The Doors', 'Elton John',
                  'Bob Dylan', 'Neil Young',
                ].map((artist) => (
                  <Badge key={artist} variant="secondary" className="text-sm">
                    {artist}
                  </Badge>
                ))}
              </div>
            </section>

            {/* ── CTA ── */}
            <div className="bg-primary/10 rounded-xl p-6 md:p-8 text-center space-y-4">
              <Headphones className="w-10 h-10 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-card-dark-foreground">Beluister deze aflevering</h3>
              <p className="text-card-dark-foreground/80 max-w-lg mx-auto">
                Wil je het volledige verhaal horen? Luister naar seizoen 1, aflevering 6 van <em>De Plaat en het Verhaal</em>.
              </p>
              <Button size="lg" asChild>
                <a
                  href="https://www.deplaathetverhaal.nl/episodes/episode/3f2840e9/podcast-winter-in-hamburg-van-frank-boeijen-groep"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  Beluister S1E6 — Winter in Hamburg
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>

            {/* Back link */}
            <div className="mt-12 text-center">
              <Link to="/podcasts">
                <Button variant="outline" size="sm">
                  ← Alle podcasts
                </Button>
              </Link>
            </div>

          </div>
        </article>
      </div>
    </>
  );
}
