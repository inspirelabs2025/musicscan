import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SafeImage from "@/components/SafeImage";
import { StudioStructuredData } from "@/components/SEO/StudioStructuredData";
import {
  Building2, MapPin, Calendar, Clock, Eye, ArrowLeft,
  Users, Music, Wrench, Youtube
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface StudioStory {
  id: string;
  studio_name: string;
  slug: string;
  location: string | null;
  founded_year: number | null;
  story_content: string;
  artwork_url: string | null;
  reading_time: number | null;
  word_count: number | null;
  views_count: number | null;
  notable_artists: string[] | null;
  producers: string[] | null;
  famous_recordings: string[] | null;
  equipment_highlights: string[] | null;
  youtube_videos: { video_id: string; title: string; artist: string }[] | null;
  meta_title: string | null;
  meta_description: string | null;
}

export default function StudioStoryDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['studio-story', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      return data as StudioStory;
    },
    enabled: !!slug
  });

  // Increment view count
  useEffect(() => {
    if (story?.id) {
      supabase
        .from('studio_stories')
        .update({ views_count: (story.views_count || 0) + 1 })
        .eq('id', story.id)
        .then(() => {});
    }
  }, [story?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Studio niet gevonden</h1>
          <p className="text-muted-foreground mb-4">Deze studio pagina bestaat niet of is niet gepubliceerd.</p>
          <Button asChild>
            <Link to="/studio-stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar overzicht
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const youtubeVideos = story.youtube_videos as { video_id: string; title: string; artist: string }[] | null;

  return (
    <>
      <Helmet>
        <title>{story.meta_title || `${story.studio_name} | MusicScan`}</title>
        <meta name="description" content={story.meta_description || `Ontdek het verhaal van ${story.studio_name}`} />
        <link rel="canonical" href={`https://www.musicscan.app/studio-stories/${story.slug}`} />
      </Helmet>

      <StudioStructuredData
        name={story.studio_name}
        description={story.meta_description || `Ontdek het verhaal van ${story.studio_name}`}
        image={story.artwork_url || undefined}
        url={`https://www.musicscan.app/studio-stories/${story.slug}`}
        location={story.location || undefined}
        foundingDate={story.founded_year?.toString()}
        notableArtists={story.notable_artists || undefined}
        famousRecordings={story.famous_recordings || undefined}
      />

      <div className="min-h-screen bg-background">
        {/* Hero with artwork */}
        <div className="relative overflow-hidden">
          {/* Background Image */}
          {story.artwork_url && (
            <div className="absolute inset-0">
              <SafeImage
                src={story.artwork_url}
                fallbackSrc="/placeholder.svg"
                alt={`${story.studio_name} studio afbeelding`}
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
            </div>
          )}
          {!story.artwork_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
          )}

          <div className="relative container mx-auto px-4 py-12 md:py-20">
            <Button variant="ghost" size="sm" asChild className="mb-6 bg-background/50 backdrop-blur-sm hover:bg-background/70">
              <Link to="/studio-stories">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Studio's
              </Link>
            </Button>

            <div className="flex items-start gap-6">
              {/* Studio Image Thumbnail */}
              <div className="hidden md:block h-32 w-32 rounded-xl overflow-hidden shadow-xl shrink-0 border border-border/40 bg-background/20">
                {story.artwork_url ? (
                  <img
                    src={story.artwork_url}
                    alt={`${story.studio_name} studio thumbnail`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">{story.studio_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {story.location && (
                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded">
                      <MapPin className="h-4 w-4" />
                      {story.location}
                    </div>
                  )}
                  {story.founded_year && (
                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded">
                      <Calendar className="h-4 w-4" />
                      Opgericht {story.founded_year}
                    </div>
                  )}
                  {story.reading_time && (
                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded">
                      <Clock className="h-4 w-4" />
                      {story.reading_time} min leestijd
                    </div>
                  )}
                  {story.views_count && story.views_count > 0 && (
                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded">
                      <Eye className="h-4 w-4" />
                      {story.views_count} views
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{story.story_content}</ReactMarkdown>
              </article>

              {/* YouTube Videos */}
              {youtubeVideos && youtubeVideos.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Youtube className="h-6 w-6 text-red-500" />
                    Iconische Opnames
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {youtubeVideos.slice(0, 6).map((video, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <div className="aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.video_id}`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.artist}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notable Artists */}
              {story.notable_artists && story.notable_artists.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Bekende Artiesten
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {story.notable_artists.map((artist, idx) => (
                        <Badge key={idx} variant="secondary">{artist}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Producers */}
              {story.producers && story.producers.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      Producers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {story.producers.map((producer, idx) => (
                        <Badge key={idx} variant="outline">{producer}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Famous Recordings */}
              {story.famous_recordings && story.famous_recordings.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      Bekende Opnames
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {story.famous_recordings.map((recording, idx) => (
                        <li key={idx} className="text-muted-foreground">• {recording}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Equipment */}
              {story.equipment_highlights && story.equipment_highlights.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Apparatuur
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {story.equipment_highlights.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
