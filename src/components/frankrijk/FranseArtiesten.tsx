import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, User } from "lucide-react";
import { useFranseArtiesten } from "@/hooks/useFranseMuziek";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedArtist {
  name: string;
  genre: string;
  emoji: string;
  description: string;
  slug?: string;
}

// Fallback data with emojis when no image available
const FEATURED_ARTISTS_FALLBACK: FeaturedArtist[] = [
  { name: "Daft Punk", genre: "Electronic", emoji: "🤖", description: "Iconisch French House duo, Grammy-winnaars", slug: "daft-punk" },
  { name: "Édith Piaf", genre: "Chanson", emoji: "🎤", description: "La Môme, stem van Frankrijk", slug: "edith-piaf" },
  { name: "Serge Gainsbourg", genre: "Pop/Chanson", emoji: "🎵", description: "Provocateur en genie", slug: "serge-gainsbourg" },
  { name: "David Guetta", genre: "EDM", emoji: "🎧", description: "'s Werelds meest succesvolle DJ", slug: "david-guetta" },
  { name: "Johnny Hallyday", genre: "Rock", emoji: "🎸", description: "De French Elvis", slug: "johnny-hallyday" },
  { name: "Air", genre: "Electronic", emoji: "✨", description: "Ambient electronic pioniers", slug: "air" },
  { name: "Phoenix", genre: "Indie Rock", emoji: "🎹", description: "Grammy-winnende rockband uit Versailles", slug: "phoenix" },
  { name: "Gojira", genre: "Metal", emoji: "🔊", description: "Environmental death metal giganten", slug: "gojira" }
];

export const FranseArtiesten = () => {
  const navigate = useNavigate();
  const { data: dbArtists, isLoading } = useFranseArtiesten();

  // Create a map of database artists for quick lookup
  const artistImageMap = new Map(
    (dbArtists || []).map(a => [a.artist_name.toLowerCase(), { artwork_url: a.artwork_url, slug: a.slug }])
  );

  // Merge fallback data with real images from database
  const displayArtists = FEATURED_ARTISTS_FALLBACK.map(artist => {
    const dbInfo = artistImageMap.get(artist.name.toLowerCase());
    return {
      ...artist,
      artwork_url: dbInfo?.artwork_url || null,
      slug: dbInfo?.slug || artist.slug
    };
  });

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              🇫🇷 Uitgelichte Franse Artiesten
            </h2>
            <p className="text-muted-foreground">
              Iconen van de Franse muziekscène
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/artists?country=frankrijk')}
            className="hidden md:flex gap-2 border-[#0055A4]/30 hover:border-[#0055A4]"
          >
            Alle Artiesten
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-square rounded-xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            displayArtists.map((artist) => (
              <Card
                key={artist.name}
                className="group cursor-pointer hover:border-[#0055A4]/50 transition-all"
                onClick={() => artist.slug && navigate(`/artists/${artist.slug}`)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square rounded-xl mb-3 overflow-hidden">
                    {artist.artwork_url ? (
                      <img
                        src={artist.artwork_url}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0055A4]/20 via-muted to-[#EF4135]/20 flex items-center justify-center group-hover:from-[#0055A4]/30 group-hover:to-[#EF4135]/30 transition-all">
                        <span className="text-5xl">{artist.emoji}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-[#0055A4] transition-colors">
                    {artist.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Music className="h-3 w-3" />
                    {artist.genre}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {artist.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mobile Button */}
        <div className="mt-6 md:hidden">
          <Button
            variant="outline"
            onClick={() => navigate('/artists?country=frankrijk')}
            className="w-full gap-2 border-[#0055A4]/30"
          >
            Bekijk Alle Franse Artiesten
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
