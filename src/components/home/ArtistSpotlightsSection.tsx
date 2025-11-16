import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArtistSpotlights, extractSpotlightIntro } from "@/hooks/useArtistSpotlight";
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

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {spotlights.slice(0, 3).map((spotlight) => {
            const intro = extractSpotlightIntro(spotlight);
            
            return (
              <Link 
                key={spotlight.id} 
                to={`/artist-spotlight/${spotlight.slug}`}
                className="group"
              >
                <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-border/50">
                  {spotlight.artwork_url && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={spotlight.artwork_url}
                        alt={spotlight.artist_name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <Badge 
                        variant="secondary" 
                        className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Spotlight
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {spotlight.artist_name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed mt-2">
                      {intro}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {spotlight.reading_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{spotlight.reading_time} min</span>
                        </div>
                      )}
                      {spotlight.views_count && spotlight.views_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{spotlight.views_count}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
