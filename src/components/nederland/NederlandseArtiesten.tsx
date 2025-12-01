import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Eye, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNederlandseArtiesten } from "@/hooks/useNederlandseMuziek";

export function NederlandseArtiesten() {
  const { data: artiesten, isLoading } = useNederlandseArtiesten();

  // Featured Dutch artists with their info and real Discogs images
  const featuredArtists = [
    { 
      name: "Within Temptation", 
      genre: "Symphonic Metal", 
      emoji: "🎸",
      image: "https://i.discogs.com/efRgkeS38PUBISwmXILMfOff9gNWT_83qegUp5ICfXU/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTE2MDA3/Ny0xNjkyOTAyNTM1/LTMxNTcucG5n.jpeg"
    },
    { 
      name: "Golden Earring", 
      genre: "Rock", 
      emoji: "🎵",
      image: "https://i.discogs.com/nklP1886ZFTIiecFv6mCJv8Mf9TOFXfhl209NIkIplg/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTI0NzAw/OS0xNDQ4MTk5MDc1/LTExODUucG5n.jpeg"
    },
    { 
      name: "André Hazes", 
      genre: "Levenslied", 
      emoji: "🎤",
      image: "https://i.discogs.com/uUjvLbv-O_zOuQdvQoXfXVpIydEOdr14anprrzxzLYU/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTI4MjI4/Ny0xNjI1OTMzMTMz/LTY4MDAuanBlZw.jpeg"
    },
    { 
      name: "Marco Borsato", 
      genre: "Pop", 
      emoji: "🎹",
      image: "https://i.discogs.com/kcj7FJHXgZPu4TSb2fYsbrK5j4S7Im6xNGxuqFucB2s/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTI4NzM3/NS0xMTE0NDU4MDg5/LmpwZw.jpeg"
    },
    { 
      name: "Doe Maar", 
      genre: "Nederpop", 
      emoji: "🎺",
      image: "https://i.discogs.com/4jwmwkhjDXyQqKb5fUl-5mLFmEaIRoxSvidw-HKM4lY/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTI2MDI4/My0xNTQxMzMyNjc4/LTIzNzkuanBlZw.jpeg"
    },
    { 
      name: "Anouk", 
      genre: "Rock/Pop", 
      emoji: "🎙️",
      image: "https://i.discogs.com/KO246b-R868CK3JyMSvjowcnHpwwvbsU34aRQR_7aDE/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTU4MzUw/LTE2MTE0NzM5MTUt/NTQ0Mi5qcGVn.jpeg"
    },
    { 
      name: "Tiësto", 
      genre: "Electronic", 
      emoji: "🎧",
      image: "https://i.discogs.com/73dpXgGTXxQSJpLb1UvlL1USj891YnIF_OszcEmqqyY/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTYxOTct/MTY3Mjc0NjM1My0z/Mjk2LmpwZWc.jpeg"
    },
    { 
      name: "Armin van Buuren", 
      genre: "Trance", 
      emoji: "🔊",
      image: "https://i.discogs.com/NRd0WGL2gN4Ss13Z5FCQNq4mDGp7d0OHalKQQGjJZbw/rs:fit/g:sm/q:90/h:500/w:500/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTkwNzAt/MTY3NjI1NjY3OS0z/ODg1LmpwZWc.jpeg"
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
  artist: { name: string; genre: string; emoji: string; image: string };
  artistData?: {
    artwork_url?: string;
    views_count?: number;
    music_style?: string[];
  };
}

function ArtistCard({ artist, artistData }: ArtistCardProps) {
  // Use artist story artwork if available, otherwise use Discogs image
  const imageUrl = artistData?.artwork_url || artist.image;
  
  return (
    <Card className="group relative overflow-hidden h-48 md:h-56 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[hsl(24,100%,50%)]/30">
      {/* Background Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            // Hide image on error, fallback gradient will show
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      
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
