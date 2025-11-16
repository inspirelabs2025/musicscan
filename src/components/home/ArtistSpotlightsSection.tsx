import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArtistSpotlights } from "@/hooks/useArtistSpotlight";
import { Skeleton } from "@/components/ui/skeleton";

export const ArtistSpotlightsSection = () => {
  const { data: spotlights, isLoading } = useArtistSpotlights({ 
    published: true,
    limit: 3 
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-3xl font-bold">Artiest Spotlights</h2>
                <p className="text-muted-foreground">Ontdek verhalen over legendarische artiesten</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!spotlights || spotlights.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold">Artiest Spotlights</h2>
              <p className="text-muted-foreground">Ontdek verhalen over legendarische artiesten</p>
            </div>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link to="/artist-spotlights">
              Alle Spotlights
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {spotlights.slice(0, 3).map((spotlight) => (
            <Link 
              key={spotlight.id} 
              to={`/artist-spotlight/${spotlight.slug}`}
              className="group"
            >
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-1">
                {spotlight.artwork_url && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={spotlight.artwork_url}
                      alt={spotlight.artist_name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {spotlight.artist_name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Spotlight
                    </Badge>
                  </div>
                  {spotlight.spotlight_description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {spotlight.spotlight_description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {spotlight.reading_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{spotlight.reading_time} min</span>
                      </div>
                    )}
                    {spotlight.views_count && spotlight.views_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{spotlight.views_count}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/artist-spotlights">
              Alle Spotlights
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
