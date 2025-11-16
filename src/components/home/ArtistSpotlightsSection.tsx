import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArtistSpotlights, extractSpotlightIntro, getSpotlightImageUrl } from "@/hooks/useArtistSpotlight";
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
    <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Artiest Spotlights</h2>
              <p className="text-muted-foreground mt-1">Ontdek verhalen over legendarische artiesten</p>
            </div>
          </div>
          <Button asChild variant="outline" className="hidden md:flex group">
            <Link to="/artist-spotlights">
              Alle Spotlights
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {spotlights.slice(0, 3).map((spotlight) => {
            const intro = extractSpotlightIntro(spotlight);
            const imageUrl = getSpotlightImageUrl(spotlight);
            
            return (
              <Link 
                key={spotlight.id} 
                to={`/artist-spotlight/${spotlight.slug}`}
                className="group block"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border/60">
                  <div className="grid md:grid-cols-[400px_1fr] gap-0">
                    {imageUrl ? (
                      <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden bg-muted">
                        <img
                          src={imageUrl}
                          alt={`${spotlight.artist_name} spotlight afbeelding`}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/40" />
                      </div>
                    ) : (
                      <div className="relative aspect-[4/3] md:aspect-auto bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 flex items-center justify-center min-h-[280px]">
                        <Sparkles className="w-20 h-20 text-primary/40" />
                      </div>
                    )}
                    
                    <div className="flex flex-col justify-between p-8">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-3xl md:text-4xl font-bold leading-tight group-hover:text-primary transition-colors">
                            {spotlight.artist_name}
                          </CardTitle>
                          <Badge 
                            className="shrink-0 bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-lg px-3 py-1"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Spotlight
                          </Badge>
                        </div>
                        
                        {intro && (
                          <CardDescription className="text-lg leading-relaxed line-clamp-3">
                            {intro}
                          </CardDescription>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mt-6 pt-4 border-t border-border/40">
                        {spotlight.reading_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{spotlight.reading_time} min lezen</span>
                          </div>
                        )}
                        {spotlight.views_count && spotlight.views_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{spotlight.views_count} views</span>
                          </div>
                        )}
                        <div className="ml-auto">
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button asChild variant="outline" className="w-full group">
            <Link to="/artist-spotlights">
              Alle Spotlights
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
