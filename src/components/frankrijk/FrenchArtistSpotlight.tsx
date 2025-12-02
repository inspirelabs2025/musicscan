import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Music, ExternalLink, RefreshCw } from "lucide-react";
import { useFranseArtiesten } from "@/hooks/useFranseMuziek";

export const FrenchArtistSpotlight = () => {
  const navigate = useNavigate();
  const { data: artists, isLoading } = useFranseArtiesten();
  const [spotlightArtist, setSpotlightArtist] = useState<typeof artists extends (infer T)[] ? T : never | null>(null);

  useEffect(() => {
    if (artists && artists.length > 0) {
      const randomIndex = Math.floor(Math.random() * artists.length);
      setSpotlightArtist(artists[randomIndex]);
    }
  }, [artists]);

  const refreshSpotlight = () => {
    if (artists && artists.length > 0) {
      const randomIndex = Math.floor(Math.random() * artists.length);
      setSpotlightArtist(artists[randomIndex]);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!spotlightArtist) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ✨ Artiest in de Spotlight
          </h2>
          <p className="text-muted-foreground">
            Ontdek een Franse artiest
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden border-[#0055A4]/20">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-1/3 aspect-square bg-gradient-to-br from-[#0055A4] to-[#EF4135] flex items-center justify-center">
                {spotlightArtist.artwork_url ? (
                  <img
                    src={spotlightArtist.artwork_url}
                    alt={spotlightArtist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-24 w-24 text-white/50" />
                )}
              </div>

              {/* Content */}
              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#0055A4]/10 text-[#0055A4] rounded-full text-xs font-medium mb-2">
                      🇫🇷 Franse Artiest
                    </span>
                    <h3 className="text-2xl font-bold text-foreground">
                      {spotlightArtist.artist_name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshSpotlight}
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Genres */}
                {spotlightArtist.music_style && spotlightArtist.music_style.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {spotlightArtist.music_style.slice(0, 4).map((style, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
                      >
                        <Music className="h-3 w-3" />
                        {style}
                      </span>
                    ))}
                  </div>
                )}

                {/* Biography */}
                {spotlightArtist.biography && (
                  <p className="text-muted-foreground text-sm line-clamp-4 mb-4">
                    {spotlightArtist.biography}
                  </p>
                )}

                {/* Action */}
                <Button
                  onClick={() => navigate(`/artists/${spotlightArtist.slug}`)}
                  className="gap-2 bg-[#0055A4] hover:bg-[#0055A4]/80"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lees Meer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
