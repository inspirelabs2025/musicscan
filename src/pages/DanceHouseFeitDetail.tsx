import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, Music, Users, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getDanceHouseFeitBySlug, DANCE_HOUSE_FEITEN } from '@/data/danceHouseMuziekFeiten';

const DanceHouseFeitDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const feit = slug ? getDanceHouseFeitBySlug(slug) : undefined;

  if (!feit) {
    return (
      <>
        <Helmet>
          <title>Feit niet gevonden | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Feit niet gevonden</h1>
            <Button asChild>
              <Link to="/dance-house">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar Dance & House
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const pageUrl = `https://www.musicscan.app/dh-muziekfeit/${feit.slug}`;
  const pageTitle = `${feit.title} (${feit.year}) - Dance Muziek Geschiedenis | MusicScan`;
  
  // Get related facts (same decade or subgenre)
  const relatedFeiten = DANCE_HOUSE_FEITEN
    .filter(f => f.slug !== feit.slug && (f.decade === feit.decade || f.subgenre === feit.subgenre))
    .slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": feit.title,
    "description": feit.description,
    "datePublished": `${feit.year}-01-01`,
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan" },
    "mainEntityOfPage": pageUrl
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={feit.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={feit.description} />
        <meta property="og:url" content={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-cyan-950 via-purple-950 to-pink-950">
        {/* Hero */}
        <section className="relative py-20">
          <div className="container mx-auto px-4">
            {/* Back button */}
            <Link
              to="/dance-house"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar Dance & House
            </Link>

            <div className="max-w-4xl">
              {/* Year badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-full mb-6">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold text-lg">{feit.year}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{feit.title}</h1>
              
              <p className="text-xl text-white/80 mb-8">{feit.description}</p>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 mb-8">
                {feit.subgenre && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {feit.subgenre}
                  </span>
                )}
                <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-sm">
                  Jaren '{feit.decade.replace('s', '')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 bg-background/95">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
              {/* Main content */}
              <div className="md:col-span-2 space-y-8">
                {/* Historical context */}
                {feit.historicalContext && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-cyan-500" />
                        Historische Context
                      </h2>
                      <p className="text-muted-foreground">{feit.historicalContext}</p>
                    </CardContent>
                  </Card>
                )}

                {/* YouTube embed */}
                {feit.youtubeId && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Play className="w-5 h-5 text-red-500" />
                        Bekijk & Luister
                      </h2>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${feit.youtubeId}`}
                          title={feit.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related artists */}
                {feit.relatedArtists && feit.relatedArtists.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Gerelateerde Artiesten
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {feit.relatedArtists.map((artist) => (
                          <Link
                            key={artist}
                            to={`/artists?search=${encodeURIComponent(artist)}`}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-full text-purple-400 transition-colors"
                          >
                            {artist}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Famous track */}
                {feit.famousTrack && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">Bekende Track</h3>
                      <p className="text-cyan-400">{feit.famousTrack}</p>
                      {feit.spotifyUri && (
                        <a
                          href={`https://open.spotify.com/track/${feit.spotifyUri}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-green-400 mt-2 hover:underline"
                        >
                          Luister op Spotify
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Related facts */}
                {relatedFeiten.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Gerelateerde Feiten</h3>
                      <div className="space-y-3">
                        {relatedFeiten.map((related) => (
                          <Link
                            key={related.slug}
                            to={`/dh-muziekfeit/${related.slug}`}
                            className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="text-xs text-muted-foreground mb-1">{related.year}</div>
                            <div className="text-sm font-medium line-clamp-2">{related.title}</div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default DanceHouseFeitDetail;
