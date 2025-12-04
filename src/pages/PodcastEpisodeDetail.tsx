import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { usePodcastEpisodeBySlug, useRelatedEpisodes } from '@/hooks/usePodcastDetail';
import { PodcastEpisodeStructuredData } from '@/components/SEO/PodcastStructuredData';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Clock, Calendar, Eye, Share2, ChevronLeft, Headphones } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minuten`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours} uur ${remainingMins} minuten`;
}

function formatShortDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}u ${remainingMins}m`;
}

export default function PodcastEpisodeDetail() {
  const { podcastSlug, episodeSlug } = useParams<{ podcastSlug: string; episodeSlug: string }>();
  const { data, isLoading } = usePodcastEpisodeBySlug(podcastSlug, episodeSlug);
  const { data: relatedEpisodes } = useRelatedEpisodes(data?.podcast.id, data?.episode.id);

  const baseUrl = 'https://www.musicscan.app';
  const podcastUrl = `${baseUrl}/podcast/${podcastSlug}`;
  const episodeUrl = `${baseUrl}/podcast/${podcastSlug}/${episodeSlug}`;

  const handleShare = async () => {
    if (navigator.share && data) {
      await navigator.share({
        title: data.episode.title,
        text: data.episode.description || `Luister naar ${data.episode.title}`,
        url: episodeUrl,
      });
    } else {
      navigator.clipboard.writeText(episodeUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Aflevering niet gevonden</h1>
          <Link to="/podcasts">
            <Button>Terug naar podcasts</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { episode, podcast } = data;
  const artworkUrl = episode.episode_artwork_url || podcast.artwork_url;

  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Podcasts', url: `${baseUrl}/podcasts` },
    { name: podcast.name, url: podcastUrl },
    { name: episode.title, url: episodeUrl },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{episode.title} | {podcast.name} - MusicScan Podcast</title>
        <meta name="description" content={episode.description || `Luister naar ${episode.title} van ${podcast.name}`} />
        <meta property="og:title" content={`${episode.title} | ${podcast.name}`} />
        <meta property="og:description" content={episode.description || `Luister naar ${episode.title}`} />
        <meta property="og:type" content="music.episode" />
        <meta property="og:url" content={episodeUrl} />
        {artworkUrl && <meta property="og:image" content={artworkUrl} />}
        <meta property="og:audio" content={episode.audio_url} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={episodeUrl} />
      </Helmet>

      <PodcastEpisodeStructuredData
        name={episode.title}
        description={episode.description || ''}
        datePublished={episode.published_at || undefined}
        duration={episode.audio_duration_seconds || undefined}
        audioUrl={episode.audio_url}
        imageUrl={artworkUrl || undefined}
        url={episodeUrl}
        podcastName={podcast.name}
        podcastUrl={podcastUrl}
        seasonNumber={episode.season_number || undefined}
        episodeNumber={episode.episode_number || undefined}
      />

      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container relative z-10">
            <BreadcrumbNavigation items={breadcrumbItems} className="mb-6" />
            
            <Link to={`/podcast/${podcastSlug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Terug naar {podcast.name}
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Episode Artwork */}
              <div className="flex-shrink-0">
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt={episode.title}
                    className="w-80 h-80 rounded-2xl shadow-2xl object-cover border-4 border-background/50"
                  />
                ) : (
                  <div className="w-80 h-80 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                    <Mic className="w-24 h-24 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Episode Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                    <Mic className="w-3 h-3 mr-1" />
                    {podcast.name}
                  </Badge>
                  {episode.season_number && episode.episode_number && (
                    <Badge variant="outline">
                      Seizoen {episode.season_number} • Aflevering {episode.episode_number}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {episode.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {episode.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(episode.published_at), 'd MMMM yyyy', { locale: nl })}
                    </span>
                  )}
                  {episode.audio_duration_seconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(episode.audio_duration_seconds)}
                    </span>
                  )}
                  {episode.views_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {episode.views_count} weergaven
                    </span>
                  )}
                </div>

                {/* Audio Player */}
                <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Nu luisteren</p>
                        <p className="text-sm text-muted-foreground">{episode.title}</p>
                      </div>
                    </div>
                    <audio
                      controls
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={episode.audio_url} type="audio/mpeg" />
                      Je browser ondersteunt geen audio afspelen.
                    </audio>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleShare} variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Delen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        {episode.description && (
          <section className="container py-12">
            <h2 className="text-xl font-bold mb-4">Over deze aflevering</h2>
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {episode.description}
              </p>
            </div>
          </section>
        )}

        {/* Related Episodes */}
        {relatedEpisodes && relatedEpisodes.length > 0 && (
          <section className="container py-12 border-t">
            <h2 className="text-xl font-bold mb-6">Meer afleveringen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedEpisodes.map((related) => (
                <Link 
                  key={related.id} 
                  to={`/podcast/${podcastSlug}/${related.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all h-full">
                    <div className="aspect-square relative">
                      {related.episode_artwork_url || podcast.artwork_url ? (
                        <img
                          src={related.episode_artwork_url || podcast.artwork_url || ''}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <Mic className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        {related.season_number && related.episode_number && (
                          <Badge variant="outline" className="text-xs">
                            S{related.season_number}E{related.episode_number}
                          </Badge>
                        )}
                        {related.audio_duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatShortDuration(related.audio_duration_seconds)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
