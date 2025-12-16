import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, Music, Users, ExternalLink, Play, Film, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getFilmmuziekFeitBySlug, FILMMUZIEK_FEITEN } from '@/data/filmmuziekFeiten';

const FilmmuziekFeitDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const feit = slug ? getFilmmuziekFeitBySlug(slug) : undefined;

  if (!feit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Feit niet gevonden</h1>
          <Button asChild>
            <Link to="/filmmuziek">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar Filmmuziek
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pageUrl = `https://www.musicscan.app/filmmuziek/feit/${feit.slug}`;
  const pageTitle = `${feit.title} (${feit.year}) - Filmmuziek Geschiedenis | MusicScan`;
  
  // Get related facts (same decade or subgenre)
  const relatedFeiten = FILMMUZIEK_FEITEN
    .filter(f => f.slug !== feit.slug && (f.decade === feit.decade || f.subgenre === feit.subgenre))
    .slice(0, 4);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": feit.title,
    "description": feit.description,
    "datePublished": `${feit.year}-01-01`,
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan" },
    "mainEntityOfPage": pageUrl,
    "about": {
      "@type": "MusicComposition",
      "name": feit.famousTrack || feit.title,
      "composer": feit.relatedArtists?.[0] || "Unknown"
    }
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
        {feit.imageUrl && <meta property="og:image" content={feit.imageUrl} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-red-950">
        {/* Hero */}
        <section className="relative py-20">
          {/* Background image if available */}
          {feit.imageUrl && (
            <div 
              className="absolute inset-0 opacity-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${feit.imageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/50 to-amber-950" />
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Back button */}
            <Link
              to="/filmmuziek"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar Filmmuziek
            </Link>

            <div className="max-w-4xl">
              {/* Year badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full mb-6">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold text-lg">{feit.year}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{feit.title}</h1>
              
              <p className="text-xl text-white/80 mb-8">{feit.description}</p>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 mb-8">
                {feit.subgenre && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm flex items-center gap-1">
                    <Film className="w-3 h-3" />
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
                        <Award className="w-5 h-5 text-amber-500" />
                        Historische Context
                      </h2>
                      <p className="text-muted-foreground leading-relaxed">{feit.historicalContext}</p>
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

                {/* Related composers/artists */}
                {feit.relatedArtists && feit.relatedArtists.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-500" />
                        Componisten & Artiesten
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {feit.relatedArtists.map((artist) => (
                          <Link
                            key={artist}
                            to={`/artists?search=${encodeURIComponent(artist)}`}
                            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-full text-orange-400 transition-colors"
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
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Music className="w-4 h-4 text-amber-500" />
                        Bekende Track
                      </h3>
                      <p className="text-amber-400 font-medium">{feit.famousTrack}</p>
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
                      <h3 className="font-semibold mb-4">Gerelateerde Filmmuziek</h3>
                      <div className="space-y-3">
                        {relatedFeiten.map((related) => (
                          <Link
                            key={related.slug}
                            to={`/filmmuziek/feit/${related.slug}`}
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

                {/* Quick links */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Ontdek Meer</h3>
                    <div className="space-y-2">
                      <Link
                        to="/filmmuziek"
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        → Alle Filmmuziek
                      </Link>
                      <Link
                        to="/quizzen"
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        → Filmmuziek Quiz
                      </Link>
                      <Link
                        to="/artists"
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        → Componisten
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default FilmmuziekFeitDetail;
