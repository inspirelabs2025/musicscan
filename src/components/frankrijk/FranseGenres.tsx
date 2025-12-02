import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Mic2, Radio, Headphones, Guitar, Disc } from "lucide-react";

interface GenreInfo {
  name: string;
  description: string;
  artists: string[];
  icon: React.ReactNode;
  color: string;
}

const FRENCH_GENRES: GenreInfo[] = [
  {
    name: "Chanson Française",
    description: "Het hart van de Franse muziekcultuur, poëtische liedkunst met emotionele diepgang",
    artists: ["Édith Piaf", "Charles Aznavour", "Georges Brassens", "Jacques Brel"],
    icon: <Mic2 className="h-6 w-6" />,
    color: "from-amber-500/20 to-amber-600/20"
  },
  {
    name: "French House",
    description: "Revolutionaire electronic dance muziek die de wereld veroverde",
    artists: ["Daft Punk", "Justice", "Cassius", "Bob Sinclar"],
    icon: <Headphones className="h-6 w-6" />,
    color: "from-blue-500/20 to-blue-600/20"
  },
  {
    name: "Yé-yé",
    description: "De Franse tienerpopmuziek van de jaren '60, jeugdig en vrolijk",
    artists: ["France Gall", "Françoise Hardy", "Sylvie Vartan", "Claude François"],
    icon: <Radio className="h-6 w-6" />,
    color: "from-pink-500/20 to-pink-600/20"
  },
  {
    name: "French Touch",
    description: "Ambient electronic pop met een distinctieve Franse signatuur",
    artists: ["Air", "Phoenix", "M83", "Breakbot"],
    icon: <Music className="h-6 w-6" />,
    color: "from-purple-500/20 to-purple-600/20"
  },
  {
    name: "Variété Française",
    description: "Populaire Franse popmuziek, toegankelijk voor een breed publiek",
    artists: ["Johnny Hallyday", "Michel Sardou", "Patricia Kaas", "Mylène Farmer"],
    icon: <Disc className="h-6 w-6" />,
    color: "from-emerald-500/20 to-emerald-600/20"
  },
  {
    name: "Rap Français",
    description: "Franse hip-hop met unieke flow en maatschappijkritiek",
    artists: ["MC Solaar", "IAM", "NTM", "PNL", "Aya Nakamura"],
    icon: <Guitar className="h-6 w-6" />,
    color: "from-red-500/20 to-red-600/20"
  }
];

export const FranseGenres = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            🎵 Franse Muziekgenres
          </h2>
          <p className="text-muted-foreground">
            Ontdek de diversiteit van de Franse muziekscène
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FRENCH_GENRES.map((genre) => (
            <Card
              key={genre.name}
              className="group cursor-pointer hover:border-[#0055A4]/50 transition-all"
              onClick={() => navigate(`/artists?genre=${encodeURIComponent(genre.name.toLowerCase())}&country=frankrijk`)}
            >
              <CardContent className="p-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                  genre.color
                )}>
                  {genre.icon}
                </div>

                <h3 className="text-lg font-semibold text-foreground group-hover:text-[#0055A4] transition-colors mb-2">
                  {genre.name}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                  {genre.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {genre.artists.slice(0, 3).map((artist) => (
                    <span
                      key={artist}
                      className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                    >
                      {artist}
                    </span>
                  ))}
                  {genre.artists.length > 3 && (
                    <span className="px-2 py-1 bg-[#0055A4]/10 text-[#0055A4] text-xs rounded-full">
                      +{genre.artists.length - 3}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Helper for cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
