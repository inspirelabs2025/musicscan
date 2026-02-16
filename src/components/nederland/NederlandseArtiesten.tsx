import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Eye, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNederlandseArtiesten } from "@/hooks/useNederlandseMuziek";
import { useLanguage } from "@/contexts/LanguageContext";

export function NederlandseArtiesten() {
  const { data: artiesten, isLoading } = useNederlandseArtiesten();
  const { tr } = useLanguage();
  const ch = tr.countryHubUI;

  const featuredArtists = [
    { name: "Within Temptation", genre: "Symphonic Metal", emoji: "🎸", gradient: "from-purple-900 via-red-800 to-black" },
    { name: "Golden Earring", genre: "Rock", emoji: "🎵", gradient: "from-amber-700 via-yellow-600 to-orange-800" },
    { name: "André Hazes", genre: "Levenslied", emoji: "🎤", gradient: "from-red-700 via-orange-600 to-amber-700" },
    { name: "Marco Borsato", genre: "Pop", emoji: "🎹", gradient: "from-blue-700 via-indigo-600 to-purple-700" },
    { name: "Doe Maar", genre: "Nederpop", emoji: "🎺", gradient: "from-green-700 via-teal-600 to-cyan-700" },
    { name: "Anouk", genre: "Rock/Pop", emoji: "🎙️", gradient: "from-slate-800 via-zinc-700 to-neutral-800" },
    { name: "Tiësto", genre: "Electronic", emoji: "🎧", gradient: "from-cyan-600 via-blue-500 to-indigo-600" },
    { name: "Armin van Buuren", genre: "Trance", emoji: "🔊", gradient: "from-violet-700 via-purple-600 to-fuchsia-700" },
  ];

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{ch.featuredDutchArtists} {ch.featuredDutchArtistsAccent}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (<Skeleton key={i} className="h-48 rounded-xl" />))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {ch.featuredDutchArtists}{" "}
            <span className="text-[hsl(24,100%,50%)]">{ch.featuredDutchArtistsAccent}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{ch.featuredDutchArtistsDesc}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredArtists.map((featured, index) => {
            const artistData = artiesten?.find(a => a.name.toLowerCase().includes(featured.name.toLowerCase()));
            return (
              <motion.div key={featured.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                {artistData?.slug ? (
                  <Link to={`/artist/${artistData.slug}`}><ArtistCard artist={featured} artistData={artistData} /></Link>
                ) : (
                  <ArtistCard artist={featured} artistData={artistData} />
                )}
              </motion.div>
            );
          })}
        </div>

        {artiesten && artiesten.length > 8 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-8">
            <Link to="/artists?country=netherlands" className="inline-flex items-center gap-2 text-[hsl(24,100%,50%)] hover:text-[hsl(24,100%,40%)] font-medium">
              {ch.viewAllDutchArtists.replace('{count}', String(artiesten.length))}
              <Music className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface ArtistCardProps {
  artist: { name: string; genre: string; emoji: string; gradient: string };
  artistData?: { artwork_url?: string; views_count?: number; music_style?: string[] };
}

function ArtistCard({ artist, artistData }: ArtistCardProps) {
  const hasArtwork = artistData?.artwork_url;
  return (
    <Card className="group relative overflow-hidden h-48 md:h-56 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[hsl(24,100%,50%)]/30">
      {hasArtwork ? (
        <img src={artistData.artwork_url} alt={artist.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${artist.gradient}`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4 text-6xl opacity-30">{artist.emoji}</div>
            <div className="absolute bottom-12 left-8 text-4xl opacity-20 rotate-12">{artist.emoji}</div>
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div className="text-3xl mb-2 drop-shadow-lg">{artist.emoji}</div>
        <h3 className="text-white font-bold text-lg md:text-xl line-clamp-1 drop-shadow-lg">{artist.name}</h3>
        <p className="text-white/80 text-sm drop-shadow-md">{artistData?.music_style?.[0] || artist.genre}</p>
        {artistData?.views_count && artistData.views_count > 0 && (
          <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
            <Eye className="w-3 h-3" />
            {artistData.views_count.toLocaleString()} views
          </div>
        )}
      </div>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2"><User className="w-4 h-4 text-white" /></div>
      </div>
    </Card>
  );
}
