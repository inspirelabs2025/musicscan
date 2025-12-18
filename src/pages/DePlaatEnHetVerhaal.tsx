import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PodcastHosts } from '@/components/podcast/PodcastHosts';
import { 
  Headphones, 
  Play, 
  Clock, 
  Calendar, 
  Rss,
  ExternalLink,
  Music2,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const PODCAST_SLUG = 'de-plaat-en-het-verhaal';

export default function DePlaatEnHetVerhaal() {
  // Fetch podcast details
  const { data: podcast, isLoading: loadingPodcast } = useQuery({
    queryKey: ['podcast-dpehv'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('own_podcasts')
        .select('*')
        .eq('slug', PODCAST_SLUG)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch episodes
  const { data: episodes, isLoading: loadingEpisodes } = useQuery({
    queryKey: ['podcast-dpehv-episodes'],
    queryFn: async () => {
      if (!podcast?.id) return [];
      
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .select('*')
        .eq('podcast_id', podcast.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!podcast?.id
  });

  // Fetch related blog posts (about podcasts/vinyl)
  const { data: relatedBlogs } = useQuery({
    queryKey: ['podcast-related-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, album_cover_url, yaml_frontmatter, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    }
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalEpisodes = episodes?.length || 0;
  const totalDuration = episodes?.reduce((sum, ep) => sum + (ep.audio_duration_seconds || 0), 0) || 0;
  const totalViews = episodes?.reduce((sum, ep) => sum + (ep.views_count || 0), 0) || 0;

  const rssUrl = `https://www.musicscan.app/feeds/podcast/${PODCAST_SLUG}.xml`;

  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "name": "De Plaat en het Verhaal",
    "description": podcast?.description || "Een podcast over iconische albums en de verhalen erachter.",
    "url": "https://www.musicscan.app/de-plaat-en-het-verhaal",
    "webFeed": rssUrl,
    "author": [
      { "@type": "Person", "name": "Rogier Visser" },
      { "@type": "Person", "name": "Ingmar Loman" }
    ],
    "publisher": {
      "@type": "Organization",
      "name": "MusicScan",
      "url": "https://www.musicscan.app"
    },
    "numberOfEpisodes": totalEpisodes,
    "inLanguage": "nl"
  };

  return (
    <>
      <Helmet>
        <title>De Plaat en het Verhaal | Podcast over Iconische Albums | MusicScan</title>
        <meta 
          name="description" 
          content="Luister naar De Plaat en het Verhaal - de podcast waarin Rogier Visser en Ingmar Loman je meenemen in de verhalen achter iconische albums. Vinyl, muziekgeschiedenis en meer." 
        />
        <meta property="og:title" content="De Plaat en het Verhaal | MusicScan Podcast" />
        <meta property="og:description" content="De podcast over iconische albums en hun verhalen. Gepresenteerd door Rogier Visser en Ingmar Loman." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.musicscan.app/de-plaat-en-het-verhaal" />
        {podcast?.artwork_url && <meta property="og:image" content={podcast.artwork_url} />}
        <link rel="canonical" href="https://www.musicscan.app/de-plaat-en-het-verhaal" />
        <link rel="alternate" type="application/rss+xml" title="De Plaat en het Verhaal RSS Feed" href={rssUrl} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto">
              {/* Podcast Artwork */}
              <div className="relative">
                {loadingPodcast ? (
                  <Skeleton className="w-64 h-64 rounded-2xl" />
                ) : (
                  <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/20">
                    {podcast?.artwork_url ? (
                      <img 
                        src={podcast.artwork_url} 
                        alt="De Plaat en het Verhaal" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Headphones className="w-24 h-24 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )}
                <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  🎙️ Podcast
                </Badge>
              </div>

              {/* Podcast Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  De Plaat en het Verhaal
                </h1>
                <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                  {podcast?.description || 'Een podcast over iconische albums en de verhalen erachter. Gepresenteerd door Rogier Visser en Ingmar Loman.'}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Headphones className="h-4 w-4 text-primary" />
                    <span>{totalEpisodes} Afleveringen</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{Math.round(totalDuration / 3600)}+ uur content</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Play className="h-4 w-4 text-primary" />
                    <span>{totalViews.toLocaleString()} weergaven</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button asChild>
                    <a href={rssUrl} target="_blank" rel="noopener noreferrer">
                      <Rss className="h-4 w-4 mr-2" />
                      RSS Feed
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a 
                      href="https://open.spotify.com/show/your-show-id" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Spotify
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Hosts Section */}
          <PodcastHosts />

          {/* Episodes Section */}
          <section className="py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Headphones className="h-8 w-8 text-primary" />
                  Alle Afleveringen
                </h2>
                <p className="text-muted-foreground mt-1">
                  Ontdek de verhalen achter iconische albums
                </p>
              </div>
            </div>

            {loadingEpisodes ? (
              <div className="grid gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : episodes && episodes.length > 0 ? (
              <div className="space-y-4">
                {episodes.map((episode, index) => (
                  <Card 
                    key={episode.id} 
                    className="hover:shadow-lg transition-all hover:border-primary/50"
                  >
                    <CardContent className="p-4">
                      <Link 
                        to={`/podcast/${PODCAST_SLUG}/${episode.slug}`}
                        className="flex items-center gap-4"
                      >
                        {/* Episode Number/Artwork */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary/10 flex-shrink-0">
                          {episode.episode_artwork_url || podcast?.artwork_url ? (
                            <img 
                              src={episode.episode_artwork_url || podcast?.artwork_url} 
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xl font-bold text-primary">
                                {episode.episode_number || index + 1}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {episode.season_number && episode.episode_number && (
                              <Badge variant="outline" className="text-xs">
                                S{episode.season_number}E{episode.episode_number}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">
                            {episode.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {episode.description}
                          </p>
                        </div>

                        {/* Meta Info */}
                        <div className="hidden md:flex flex-col items-end gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(episode.audio_duration_seconds)}
                          </div>
                          {episode.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(episode.published_at), 'd MMM yyyy', { locale: nl })}
                            </div>
                          )}
                        </div>

                        {/* Play Button */}
                        <Button size="icon" variant="ghost" className="flex-shrink-0">
                          <Play className="h-5 w-5" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Binnenkort beschikbaar</h3>
                  <p className="text-muted-foreground">
                    Nieuwe afleveringen worden binnenkort toegevoegd.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Related Blog Posts */}
          {relatedBlogs && relatedBlogs.length > 0 && (
            <section className="py-12 border-t">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    Gerelateerde Verhalen
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Lees meer over de albums die we bespreken
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/verhalen">Alle Verhalen</Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedBlogs.map((blog) => {
                  const frontmatter = blog.yaml_frontmatter as any;
                  return (
                    <Card key={blog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <Link to={`/plaat-verhaal/${blog.slug}`}>
                        <div className="aspect-square overflow-hidden bg-muted">
                          {blog.album_cover_url ? (
                            <img 
                              src={blog.album_cover_url} 
                              alt={frontmatter?.title || 'Album'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music2 className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-1">{frontmatter?.title || 'Album Verhaal'}</h3>
                          <p className="text-sm text-muted-foreground">{frontmatter?.artist}</p>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
