import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Music, ArrowRight } from "lucide-react";

interface FeaturedArtist {
  name: string;
  genre: string;
  emoji: string;
  description: string;
  slug?: string;
}

const FEATURED_ARTISTS: FeaturedArtist[] = [
  {
    name: "Daft Punk",
    genre: "Electronic",
    emoji: "🤖",
    description: "Iconisch French House duo, Grammy-winnaars",
    slug: "daft-punk"
  },
  {
    name: "Édith Piaf",
    genre: "Chanson",
    emoji: "🎤",
    description: "La Môme, stem van Frankrijk",
    slug: "edith-piaf"
  },
  {
    name: "Serge Gainsbourg",
    genre: "Pop/Chanson",
    emoji: "🎵",
    description: "Provocateur en genie",
    slug: "serge-gainsbourg"
  },
  {
    name: "David Guetta",
    genre: "EDM",
    emoji: "🎧",
    description: "'s Werelds meest succesvolle DJ",
    slug: "david-guetta"
  },
  {
    name: "Johnny Hallyday",
    genre: "Rock",
    emoji: "🎸",
    description: "De French Elvis",
    slug: "johnny-hallyday"
  },
  {
    name: "Air",
    genre: "Electronic",
    emoji: "✨",
    description: "Ambient electronic pioniers",
    slug: "air"
  },
  {
    name: "Phoenix",
    genre: "Indie Rock",
    emoji: "🎹",
    description: "Grammy-winnende rockband uit Versailles",
    slug: "phoenix"
  },
  {
    name: "Gojira",
    genre: "Metal",
    emoji: "🔊",
    description: "Environmental death metal giganten",
    slug: "gojira"
  }
];

export const FranseArtiesten = () => {
  const navigate = useNavigate();

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
          {FEATURED_ARTISTS.map((artist) => (
            <Card
              key={artist.name}
              className="group cursor-pointer hover:border-[#0055A4]/50 transition-all"
              onClick={() => artist.slug && navigate(`/artists/${artist.slug}`)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-gradient-to-br from-[#0055A4]/20 via-muted to-[#EF4135]/20 rounded-xl flex items-center justify-center mb-3 group-hover:from-[#0055A4]/30 group-hover:to-[#EF4135]/30 transition-all">
                  <span className="text-5xl">{artist.emoji}</span>
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
          ))}
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
