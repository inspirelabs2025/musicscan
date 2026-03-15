import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Headphones, ExternalLink, Music, MapPin, Users, Disc3, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function PodcastVerhalen() {
  return (
    <>
      <Helmet>
        <title>Het Verhaal Achter de Podcast | MusicScan</title>
        <meta
          name="description"
          content="De muzikale reis van Frank Boeijen's Winter in Hamburg — via Rob de Nijs, Liesbeth List, The Beatles in Hamburg, naar The Doors en Elton John."
        />
        <link rel="canonical" href="https://www.musicscan.app/podcasts/het-verhaal-achter-de-podcast" />
        <meta property="og:title" content="Het Verhaal Achter de Podcast | MusicScan" />
        <meta
          property="og:description"
          content="De muzikale reis van Frank Boeijen's Winter in Hamburg — via Rob de Nijs, Liesbeth List, The Beatles in Hamburg, naar The Doors en Elton John."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            name: 'Het Verhaal Achter de Podcast – Winter in Hamburg',
            description:
              'De muzikale reis van Frank Boeijen\'s Winter in Hamburg — via Rob de Nijs, Liesbeth List, The Beatles in Hamburg, naar The Doors en Elton John.',
            url: 'https://www.musicscan.app/podcasts/het-verhaal-achter-de-podcast',
            publisher: { '@type': 'Organization', name: 'MusicScan' },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-card-dark py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
          <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
            <Badge className="bg-primary/20 text-primary mb-4 text-xs">
              De Plaat en het Verhaal — S1E6
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-card-dark-foreground mb-4">
              Winter in Hamburg
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              De muzikale reis van <ArtistLink name="Frank Boeijen" /> — van Nijmegen naar Hamburg, via <ArtistLink name="Rob de Nijs" />, <ArtistLink name="Liesbeth List" />, <ArtistLink name="The Beatles" /> en <ArtistLink name="The Doors" />
            </p>
            <p className="text-sm text-muted-foreground italic">
              Onderdeel van de serie "Het Verhaal Achter de Podcast"
            </p>
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
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <p>
                  <ArtistLink name="Frank Boeijen" /> — Nederlandse zanger, dichter en componist uit Nijmegen. De jongste uit een gezin van tien kinderen. Zijn oudere broers brachten hem de muziek van <ArtistLink name="Bob Dylan" /> en <ArtistLink name="Neil Young" /> bij, een muzikale opvoeding die zijn hele carrière zou kleuren.
                </p>
                <p>
                  Via zijn broer ontmoette Frank de zeven jaar oudere <strong>Wout Pennings</strong>. In 1977 brachten ze samen een album uit in eigen beheer. Via Pennings belandde het materiaal bij platenmaatschappij <strong>CNR</strong>. Hier ontstaat ook de eerste connectie met <ArtistLink name="Rob de Nijs" /> — een draad die door het hele verhaal van deze aflevering loopt.
                </p>
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
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <h3 className="text-xl font-bold text-card-dark-foreground mt-6">Rob de Nijs</h3>
                <p>
                  De connectie tussen Frank Boeijen en <ArtistLink name="Rob de Nijs" /> gaat diep. Samen zongen ze <em>Zwart-Wit</em>. Frank schreef nummers voor Rob, waaronder <em>Huis in de Zon</em>. Rob de Nijs bracht <em>Kronenburg Park</em> uit als single — een nummer dat onlosmakelijk met Frank Boeijen verbonden is.
                </p>

                <h3 className="text-xl font-bold text-card-dark-foreground mt-8">Liesbeth List</h3>
                <p>
                  <ArtistLink name="Liesbeth List" /> — Frank hielp haar carrière weer op gang. Hij produceerde haar album <em>List</em>, dat een groot succes werd dankzij de single <em>De Verzoening</em>. Met <em>Noach</em> en <em>Vergezicht</em> bevestigde ze haar terugkeer. <em>Heb het Leven Lief</em> werd een ware klassieker.
                </p>
                <p>
                  Liesbeth maakte ook een bijzonder duet met <ArtistLink name="Charles Aznavour" /> — opvallend omdat Aznavour daarin in het Engels zong, iets wat hij zelden deed. Ze maakte ook een duet met <ArtistLink name="Whitney Houston" /> op de Nederlandse televisie — een onvergetelijk moment in de Nederlandse muziekgeschiedenis.
                </p>

                <h3 className="text-xl font-bold text-card-dark-foreground mt-8">Ilse de Lange</h3>
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
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
                <p>
                  <ArtistLink name="Keane" /> deed een eigen nummer over dezelfde stad: <em>Hamburg Song</em>. Zo komen we bij het Hamburg van de jaren '60 — een stad die een cruciale rol speelde in de popgeschiedenis.
                </p>
                <p>
                  <ArtistLink name="The Beatles" /> speelden tussen 1960 en 1962 regelmatig in clubs in Hamburg — de <strong>Top Ten Club</strong> en <strong>The Star Club</strong>. De originele line-up bestond uit John Lennon, Paul McCartney, George Harrison, Stuart Sutcliffe en Pete Best. Ze reisden met een bus naar Hamburg.
                </p>
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
              <div className="space-y-4 text-card-dark-foreground/85 leading-relaxed text-lg">
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
            </section>

            <hr className="border-primary/10 my-10" />

            {/* ── Keane en Elton John ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Music className="w-6 h-6 text-primary shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-card-dark-foreground">Keane en Elton John</h2>
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
