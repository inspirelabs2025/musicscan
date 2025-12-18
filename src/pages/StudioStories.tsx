import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Calendar, Clock, Eye } from "lucide-react";
import { Helmet } from "react-helmet";

interface StudioStory {
  id: string;
  studio_name: string;
  slug: string;
  location: string | null;
  founded_year: number | null;
  story_content: string;
  artwork_url: string | null;
  reading_time: number | null;
  views_count: number | null;
  notable_artists: string[] | null;
  is_published: boolean | null;
}

export default function StudioStories() {
  const { data: stories, isLoading } = useQuery({
    queryKey: ['public-studio-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_stories')
        .select('*')
        .eq('is_published', true)
        .order('views_count', { ascending: false });
      
      if (error) throw error;
      return data as StudioStory[];
    }
  });

  const getExcerpt = (content: string, maxLength = 150) => {
    const plainText = content.replace(/[#*_`]/g, '').replace(/\n/g, ' ');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  return (
    <>
      <Helmet>
        <title>Legendarische Opnamestudio's | MusicScan</title>
        <meta name="description" content="Ontdek de verhalen achter de meest legendarische opnamestudio's ter wereld. Van Abbey Road tot Electric Lady - de plekken waar muziekgeschiedenis werd geschreven." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Opnamestudio's</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Ontdek de verhalen achter de legendarische studio's waar muziekgeschiedenis werd geschreven.
              Van iconische opnames tot bijzondere anekdotes.
            </p>
          </div>
        </div>

        {/* Studios Grid */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stories && stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((studio) => (
                <Link 
                  key={studio.id} 
                  to={`/studio/${studio.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 hover:border-primary/50">
                    {/* Studio Image or Placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      {studio.artwork_url ? (
                        <img 
                          src={studio.artwork_url} 
                          alt={studio.studio_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-20 w-20 text-primary/50" />
                      )}
                      {studio.founded_year && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {studio.founded_year}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {studio.studio_name}
                      </h2>
                      
                      {studio.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          {studio.location}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {getExcerpt(studio.story_content)}
                      </p>

                      {/* Notable Artists */}
                      {studio.notable_artists && studio.notable_artists.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {studio.notable_artists.slice(0, 3).map((artist, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {artist}
                            </Badge>
                          ))}
                          {studio.notable_artists.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{studio.notable_artists.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {studio.reading_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {studio.reading_time} min
                          </div>
                        )}
                        {studio.views_count && studio.views_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {studio.views_count}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Binnenkort meer studio verhalen</h2>
              <p className="text-muted-foreground">
                We werken aan boeiende verhalen over legendarische opnamestudio's.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
