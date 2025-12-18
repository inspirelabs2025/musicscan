import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { usePodcastBySlug, usePodcastEpisodes } from '@/hooks/usePodcastDetail';
import { PodcastSeriesStructuredData } from '@/components/SEO/PodcastStructuredData';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Clock, Headphones, Rss, ChevronRight } from 'lucide-react';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}u ${remainingMins}m`;
}

export default function PodcastDetail() {
  const { podcastSlug } = useParams<{ podcastSlug: string }>();
  const { data: podcast, isLoading: podcastLoading } = usePodcastBySlug(podcastSlug);
  const { data: episodes, isLoading: episodesLoading } = usePodcastEpisodes(podcast?.id);

  const baseUrl = 'https://www.musicscan.app';
  const podcastUrl = `${baseUrl}/podcast/${podcastSlug}`;

  if (podcastLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!podcast) {
    return (
      <>
        <Helmet>
          <title>Podcast niet gevonden | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background">
          <main className="container py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Podcast niet gevonden</h1>
            <Link to="/podcasts">
              <Button>Terug naar podcasts</Button>
            </Link>
          </main>
        </div>
      </>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Podcasts', url: `${baseUrl}/podcasts` },
    { name: podcast.name, url: podcastUrl },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{podcast.name} | MusicScan Podcast</title>
        <meta name="description" content={podcast.description || `Luister naar ${podcast.name} - Een MusicScan Original Podcast`} />
        <meta property="og:title" content={`${podcast.name} | MusicScan Podcast`} />
        <meta property="og:description" content={podcast.description || `Luister naar ${podcast.name}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={podcastUrl} />
        {podcast.artwork_url && <meta property="og:image" content={podcast.artwork_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={podcastUrl} />
      </Helmet>

      <PodcastSeriesStructuredData
        name={podcast.name}
        description={podcast.description || ''}
        author={podcast.author || 'MusicScan'}
        imageUrl={podcast.artwork_url || undefined}
        url={podcastUrl}
        language={podcast.language || 'nl'}
      />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container relative z-10">
            <BreadcrumbNavigation items={breadcrumbItems} className="mb-6" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Podcast Artwork */}
              <div className="flex-shrink-0">
                {podcast.artwork_url ? (
                  <img
                    src={podcast.artwork_url}
                    alt={podcast.name}
                    className="w-64 h-64 rounded-2xl shadow-2xl object-cover border-4 border-background/50"
                  />
                ) : (
                  <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                    <Mic className="w-24 h-24 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Podcast Info */}
              <div className="flex-1 space-y-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                  <Mic className="w-3 h-3 mr-1" />
                  MusicScan Original
                </Badge>
                
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {podcast.name}
                </h1>
                
                {podcast.author && (
                  <p className="text-lg text-muted-foreground">
                    Door {podcast.author}
                  </p>
                )}
                
                {podcast.description && (
                  <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    {podcast.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button size="lg" className="gap-2">
                    <Headphones className="w-5 h-5" />
                    Luister op Spotify
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Rss className="w-5 h-5" />
                    RSS Feed
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Mic className="w-4 h-4" />
                    {episodes?.length || 0} afleveringen
                  </span>
                  {podcast.total_listens > 0 && (
                    <span className="flex items-center gap-1">
                      <Headphones className="w-4 h-4" />
                      {podcast.total_listens} luisteraars
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Episodes Section */}
        <section className="container py-12">
          <h2 className="text-2xl font-bold mb-8">Alle Afleveringen</h2>
          
          {episodesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : episodes && episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <Card key={episode.id} className="overflow-hidden hover:shadow-lg transition-all group">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Episode Artwork */}
                      <div className="md:w-48 flex-shrink-0">
                        {episode.episode_artwork_url || podcast.artwork_url ? (
                          <img
                            src={episode.episode_artwork_url || podcast.artwork_url || ''}
                            alt={episode.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 md:h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                            <Mic className="w-12 h-12 text-primary/50" />
                          </div>
                        )}
                      </div>

                      {/* Episode Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {episode.season_number && episode.episode_number && (
                              <Badge variant="outline" className="text-xs">
                                S{episode.season_number}E{episode.episode_number}
                              </Badge>
                            )}
                            {episode.audio_duration_seconds && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(episode.audio_duration_seconds)}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {episode.title}
                          </h3>
                          
                          {episode.description && (
                            <p className="text-muted-foreground line-clamp-2 mb-4">
                              {episode.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          {/* Audio Player */}
                          <audio
                            controls
                            className="flex-1 h-10 max-w-md"
                            preload="metadata"
                          >
                            <source src={episode.audio_url} type="audio/mpeg" />
                          </audio>

                          {episode.slug && (
                            <Link to={`/podcast/${podcastSlug}/${episode.slug}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                Bekijk details
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Mic className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nog geen afleveringen beschikbaar. Kom snel terug!
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
