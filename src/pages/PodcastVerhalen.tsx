import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Headphones, Music, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EpisodeArtist {
  name: string;
  slug?: string; // link to /muziek-verhaal/:slug or /artists/:slug
}

interface PodcastEpisodeStory {
  id: string;
  season: number;
  episode: number;
  title: string;
  summary: string;
  artists: EpisodeArtist[];
  podcastUrl: string;
  highlight?: string;
}

const episodes: PodcastEpisodeStory[] = [
  {
    id: 'winter-in-hamburg',
    season: 1,
    episode: 6,
    title: 'Winter in Hamburg - Frank Boeijen',
    summary:
      'Een muzikale reis langs Frank Boeijen en zijn iconische nummer "Winter in Hamburg" (1987, album Welkom in Utopia). De reis gaat via zijn samenwerking met Rob de Nijs en Liesbeth List, naar het Hamburg van de Beatles in de jaren \'60, via Keane en hun Hamburg Song, naar connecties met The Animals, The Doors en Elton John.',
    artists: [
      { name: 'Frank Boeijen' },
      { name: 'Rob de Nijs' },
      { name: 'Liesbeth List' },
      { name: 'Charles Aznavour' },
      { name: 'Whitney Houston' },
      { name: 'Ilse de Lange' },
      { name: 'Keane' },
      { name: 'The Beatles' },
      { name: 'Eric Clapton' },
      { name: 'The Animals' },
      { name: 'The Doors' },
      { name: 'Elton John' },
    ],
    podcastUrl:
      'https://www.deplaathetverhaal.nl/episodes/episode/3f2840e9/podcast-winter-in-hamburg-van-frank-boeijen-groep',
    highlight:
      'De song staat sinds 2009 in de NPO Radio 2 Top 2000 (hoogste notering: #1158 in 2014)',
  },
];

function EpisodeStoryCard({ ep }: { ep: PodcastEpisodeStory }) {
  return (
    <Card variant="dark" className="overflow-hidden">
      <CardContent className="p-0">
        {/* Episode header bar */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground font-mono text-xs">
              S{ep.season}E{ep.episode}
            </Badge>
            <h3 className="text-lg font-bold text-card-foreground">{ep.title}</h3>
          </div>
          <Button size="sm" asChild>
            <a href={ep.podcastUrl} target="_blank" rel="noopener noreferrer">
              <Headphones className="w-4 h-4 mr-1" />
              Beluister
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-card-dark-foreground/90 leading-relaxed">{ep.summary}</p>

          {ep.highlight && (
            <div className="flex items-start gap-2 bg-primary/10 rounded-lg px-4 py-3">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-card-dark-foreground/80">{ep.highlight}</p>
            </div>
          )}

          {/* Artists grid */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              Artiesten op de reis
            </h4>
            <div className="flex flex-wrap gap-2">
              {ep.artists.map((artist) =>
                artist.slug ? (
                  <Link key={artist.name} to={artist.slug}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {artist.name}
                    </Badge>
                  </Link>
                ) : (
                  <Badge key={artist.name} variant="secondary">
                    {artist.name}
                  </Badge>
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PodcastVerhalen() {
  return (
    <>
      <Helmet>
        <title>Het Verhaal Achter de Podcast | MusicScan</title>
        <meta
          name="description"
          content="Ontdek de muzikale reis achter elke episode van De Plaat en het Verhaal. Samenvattingen, artiesten en achtergrondverhalen."
        />
        <link rel="canonical" href="https://www.musicscan.app/podcasts/het-verhaal-achter-de-podcast" />
        <meta property="og:title" content="Het Verhaal Achter de Podcast | MusicScan" />
        <meta
          property="og:description"
          content="Ontdek de muzikale reis achter elke episode van De Plaat en het Verhaal."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Het Verhaal Achter de Podcast',
            description:
              'Ontdek de muzikale reis achter elke episode van De Plaat en het Verhaal.',
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
              De Plaat en het Verhaal
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-card-dark-foreground mb-4">
              Het Verhaal Achter de Podcast
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ontdek de muzikale reis achter elke episode van{' '}
              <em>De Plaat en het Verhaal</em>
            </p>
          </div>
        </section>

        {/* Episodes */}
        <section className="container mx-auto px-6 max-w-4xl py-12 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Afleveringen</h2>
            <Link to="/podcasts">
              <Button variant="outline" size="sm">
                ← Alle podcasts
              </Button>
            </Link>
          </div>

          {episodes.map((ep) => (
            <EpisodeStoryCard key={ep.id} ep={ep} />
          ))}
        </section>
      </div>
    </>
  );
}
