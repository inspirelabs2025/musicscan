import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Eye, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNederlandseArtiesten } from "@/hooks/useNederlandseMuziek";

// Import artist images
import withinTemptationImg from "@/assets/artists/within-temptation.jpg";
import goldenEarringImg from "@/assets/artists/golden-earring.jpg";
import andreHazesImg from "@/assets/artists/andre-hazes.jpg";
import marcoBorsatoImg from "@/assets/artists/marco-borsato.jpg";
import doeMaarImg from "@/assets/artists/doe-maar.jpg";
import anoukImg from "@/assets/artists/anouk.jpg";
import tiestoImg from "@/assets/artists/tiesto.jpg";
import arminVanBuurenImg from "@/assets/artists/armin-van-buuren.jpg";

export function NederlandseArtiesten() {
  const { data: artiesten, isLoading } = useNederlandseArtiesten();

  // Featured Dutch artists with their info and images
  const featuredArtists = [
    { 
      name: "Within Temptation", 
      genre: "Symphonic Metal", 
      emoji: "🎸",
      image: withinTemptationImg
    },
    { 
      name: "Golden Earring", 
      genre: "Rock", 
      emoji: "🎵",
      image: goldenEarringImg
    },
    { 
      name: "André Hazes", 
      genre: "Levenslied", 
      emoji: "🎤",
      image: andreHazesImg
    },
    { 
      name: "Marco Borsato", 
      genre: "Pop", 
      emoji: "🎹",
      image: marcoBorsatoImg
    },
    { 
      name: "Doe Maar", 
      genre: "Nederpop", 
      emoji: "🎺",
      image: doeMaarImg
    },
    { 
      name: "Anouk", 
      genre: "Rock/Pop", 
      emoji: "🎙️",
      image: anoukImg
    },
    { 
      name: "Tiësto", 
      genre: "Electronic", 
      emoji: "🎧",
      image: tiestoImg
    },
    { 
      name: "Armin van Buuren", 
      genre: "Trance", 
      emoji: "🔊",
      image: arminVanBuurenImg
    },
  ];

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Uitgelichte Nederlandse Artiesten</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Uitgelichte Nederlandse{" "}
            <span className="text-[hsl(24,100%,50%)]">Artiesten</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Van legende tot moderne innovator - ontdek de artiesten die de Nederlandse muziekscene hebben gevormd
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredArtists.map((featured, index) => {
            const artistData = artiesten?.find(
              a => a.name.toLowerCase().includes(featured.name.toLowerCase())
            );

            return (
              <motion.div
                key={featured.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {artistData?.slug ? (
                  <Link to={`/artist/${artistData.slug}`}>
                    <ArtistCard 
                      artist={featured} 
                      artistData={artistData}
                    />
                  </Link>
                ) : (
                  <ArtistCard 
                    artist={featured} 
                    artistData={artistData}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* All Dutch artists link */}
        {artiesten && artiesten.length > 8 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link 
              to="/artists?country=netherlands"
              className="inline-flex items-center gap-2 text-[hsl(24,100%,50%)] hover:text-[hsl(24,100%,40%)] font-medium"
            >
              Bekijk alle {artiesten.length} Nederlandse artiesten
              <Music className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface ArtistCardProps {
  artist: { name: string; genre: string; emoji: string; image?: string };
  artistData?: {
    artwork_url?: string;
    views_count?: number;
    music_style?: string[];
  };
}

function ArtistCard({ artist, artistData }: ArtistCardProps) {
  // Use artist story artwork if available, otherwise use fallback image
  const imageUrl = artistData?.artwork_url || artist.image;
  
  return (
    <Card className="group relative overflow-hidden h-48 md:h-56 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[hsl(24,100%,50%)]/30">
      {/* Background */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            // Fallback to gradient if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('bg-gradient-fallback');
          }}
        />
      ) : null}
      
      {/* Gradient fallback - always present as base layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(24,100%,50%)] to-[hsl(211,100%,35%)] -z-10" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div className="text-3xl mb-2">{artist.emoji}</div>
        <h3 className="text-white font-bold text-lg md:text-xl line-clamp-1">
          {artist.name}
        </h3>
        <p className="text-white/70 text-sm">
          {artistData?.music_style?.[0] || artist.genre}
        </p>
        {artistData?.views_count && artistData.views_count > 0 && (
          <div className="flex items-center gap-1 text-white/60 text-xs mt-1">
            <Eye className="w-3 h-3" />
            {artistData.views_count.toLocaleString()} views
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-[hsl(24,100%,50%)] rounded-full p-2">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </Card>
  );
}
