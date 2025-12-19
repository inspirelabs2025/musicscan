import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, Eye, Music, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useNederlandseArtiesten } from "@/hooks/useNederlandseMuziek";

interface SpotlightArtist {
  name: string;
  slug?: string;
  artwork?: string;
  genre?: string;
  views?: number;
  bio?: string;
}

const FALLBACK_ARTISTS: SpotlightArtist[] = [
  { name: "Golden Earring", slug: "golden-earring", genre: "Rock", bio: "Legendarische Nederlandse rockband bekend van 'Radar Love'" },
  { name: "Within Temptation", slug: "within-temptation", genre: "Symphonic Metal", bio: "Pioniers van symphonic metal uit Nederland" },
  { name: "André Hazes", slug: "andre-hazes", genre: "Levenslied", bio: "De Kleine Grote Man van het Nederlandse levenslied" },
  { name: "Tiësto", slug: "tiesto", genre: "EDM", bio: "Eerste DJ die solo optrad tijdens de Olympische Spelen" },
  { name: "Anouk", genre: "Rock", bio: "Powerhouse van de Nederlandse rock" },
  { name: "Marco Borsato", genre: "Pop", bio: "Een van de meest succesvolle Nederlandse artiesten ooit" },
];

export const DutchArtistSpotlight = () => {
  const { data: artists, isLoading } = useNederlandseArtiesten();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Combine database artists with fallbacks
  const allArtists: SpotlightArtist[] = [
    ...(artists?.map(a => ({
      name: a.name,
      slug: a.slug,
      artwork: a.artwork_url,
      genre: a.music_style?.[0],
      views: a.views_count,
      bio: a.biography ? a.biography.substring(0, 150) + '...' : undefined
    })) || []),
    ...FALLBACK_ARTISTS.filter(fa => !artists?.some(a => a.name === fa.name))
  ];

  const currentArtist = allArtists[currentIndex] || FALLBACK_ARTISTS[0];

  const nextArtist = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev + 1) % allArtists.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const randomArtist = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newIndex = Math.floor(Math.random() * allArtists.length);
    setCurrentIndex(newIndex !== currentIndex ? newIndex : (newIndex + 1) % allArtists.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Auto-rotate every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setCurrentIndex(prev => (prev + 1) % allArtists.length);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [allArtists.length, isAnimating]);

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Spotlight</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ⭐ Nederlandse Artiest in de Spotlight
          </h2>
          <p className="text-muted-foreground text-lg">
            Ontdek een willekeurige Nederlandse artiest
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="overflow-hidden border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-background to-red-500/5">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Artist Image / Gradient */}
                  <div className="relative h-64 md:h-auto md:min-h-[300px]">
                    {currentArtist.artwork ? (
                      <img
                        src={currentArtist.artwork}
                        alt={currentArtist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center">
                        <Music className="w-24 h-24 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    
                    {/* Genre Badge */}
                    {currentArtist.genre && (
                      <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm">
                        {currentArtist.genre}
                      </Badge>
                    )}

                    {/* Views Badge */}
                    {currentArtist.views && currentArtist.views > 0 && (
                      <Badge variant="secondary" className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm">
                        <Eye className="w-3 h-3 mr-1" />
                        {currentArtist.views.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  {/* Artist Info */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Uitgelichte Artiest</p>
                        <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                          {currentArtist.name}
                        </h3>
                      </div>

                      {currentArtist.bio && (
                        <p className="text-muted-foreground line-clamp-3">
                          {currentArtist.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={randomArtist}
                          disabled={isAnimating}
                          className="gap-2"
                        >
                          <Shuffle className="w-4 h-4" />
                          Verras Me
                        </Button>

                        {currentArtist.slug && (
                          <Link to={`/artists/${currentArtist.slug}`}>
                            <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                              Lees Verhaal
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Artist Counter */}
        <div className="flex justify-center gap-1 mt-6">
          {allArtists.slice(0, Math.min(10, allArtists.length)).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-orange-500 w-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
          {allArtists.length > 10 && (
            <span className="text-xs text-muted-foreground ml-2">
              +{allArtists.length - 10} meer
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
