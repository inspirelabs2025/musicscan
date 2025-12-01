import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, Music } from "lucide-react";
import { Link } from "react-router-dom";

interface Artist {
  name: string;
  genre: string;
  hit?: string;
  slug?: string;
}

interface Decade {
  year: string;
  label: string;
  color: string;
  gradient: string;
  artists: Artist[];
  description: string;
}

const DECADES: Decade[] = [
  {
    year: "60s",
    label: "1960s",
    color: "from-amber-500 to-orange-600",
    gradient: "bg-gradient-to-br from-amber-500/20 to-orange-600/20",
    description: "De geboorte van Nederlandse rock en de doorbraak in Amerika",
    artists: [
      { name: "Shocking Blue", genre: "Rock", hit: "Venus" },
      { name: "The Cats", genre: "Pop", hit: "One Way Wind" },
      { name: "Golden Earring", genre: "Rock", hit: "Please Go" },
      { name: "Ekseption", genre: "Progressive", hit: "Air" }
    ]
  },
  {
    year: "70s",
    label: "1970s",
    color: "from-orange-500 to-red-600",
    gradient: "bg-gradient-to-br from-orange-500/20 to-red-600/20",
    description: "Progressive rock en internationale doorbraken",
    artists: [
      { name: "Golden Earring", genre: "Rock", hit: "Radar Love", slug: "golden-earring" },
      { name: "Focus", genre: "Progressive Rock", hit: "Hocus Pocus" },
      { name: "Earth and Fire", genre: "Progressive", hit: "Weekend" },
      { name: "Kayak", genre: "Symphonic Rock", hit: "Starlight Dancer" }
    ]
  },
  {
    year: "80s",
    label: "1980s",
    color: "from-pink-500 to-purple-600",
    gradient: "bg-gradient-to-br from-pink-500/20 to-purple-600/20",
    description: "Nederpop explosie en iconische bands",
    artists: [
      { name: "Doe Maar", genre: "Nederpop", hit: "Sinds 1 Dag of 2" },
      { name: "Herman Brood", genre: "Rock", hit: "Saturday Night" },
      { name: "André Hazes", genre: "Levenslied", hit: "Bloed, Zweet en Tranen", slug: "andre-hazes" },
      { name: "BZN", genre: "Pop", hit: "Mon Amour" }
    ]
  },
  {
    year: "90s",
    label: "1990s",
    color: "from-blue-500 to-cyan-600",
    gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-600/20",
    description: "Alternatieve rock en de opkomst van symphonic metal",
    artists: [
      { name: "Within Temptation", genre: "Symphonic Metal", hit: "Ice Queen", slug: "within-temptation" },
      { name: "Anouk", genre: "Rock", hit: "Nobody's Wife" },
      { name: "Marco Borsato", genre: "Pop", hit: "Dromen Zijn Bedrog" },
      { name: "Volumia!", genre: "Pop", hit: "Hou Me Vast" }
    ]
  },
  {
    year: "00s",
    label: "2000s",
    color: "from-cyan-500 to-blue-600",
    gradient: "bg-gradient-to-br from-cyan-500/20 to-blue-600/20",
    description: "De Nederlandse DJ revolutie begint",
    artists: [
      { name: "Tiësto", genre: "Trance", hit: "Adagio for Strings", slug: "tiesto" },
      { name: "Armin van Buuren", genre: "Trance", hit: "In and Out of Love" },
      { name: "Krezip", genre: "Rock", hit: "I Would Stay" },
      { name: "BLØF", genre: "Pop Rock", hit: "Aan de Kust" }
    ]
  },
  {
    year: "10s",
    label: "2010s",
    color: "from-violet-500 to-purple-600",
    gradient: "bg-gradient-to-br from-violet-500/20 to-purple-600/20",
    description: "EDM domineert de wereld met Nederlandse DJ's",
    artists: [
      { name: "Martin Garrix", genre: "EDM", hit: "Animals" },
      { name: "Hardwell", genre: "EDM", hit: "Spaceman" },
      { name: "Danny Vera", genre: "Americana", hit: "Roller Coaster" },
      { name: "Kensington", genre: "Indie Rock", hit: "Sorry" }
    ]
  },
  {
    year: "20s",
    label: "2020s",
    color: "from-emerald-500 to-teal-600",
    gradient: "bg-gradient-to-br from-emerald-500/20 to-teal-600/20",
    description: "Nieuwe generatie Nederlandse sterren",
    artists: [
      { name: "S10", genre: "Pop", hit: "De Diepte" },
      { name: "Snelle", genre: "Hip Hop", hit: "Smoorverliefd" },
      { name: "Froukje", genre: "Pop", hit: "Groter Dan Ik" },
      { name: "Maan", genre: "Pop", hit: "Perfect World" }
    ]
  }
];

export const DecenniumSlider = () => {
  const [activeDecade, setActiveDecade] = useState(3); // Start at 90s
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentDecade = DECADES[activeDecade];

  const nextDecade = () => {
    setActiveDecade(prev => (prev + 1) % DECADES.length);
  };

  const prevDecade = () => {
    setActiveDecade(prev => (prev - 1 + DECADES.length) % DECADES.length);
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      intervalRef.current = setInterval(nextDecade, 3000);
      setIsPlaying(true);
    }
  };

  return (
    <section className="py-16 px-4 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            📅 Reis Door de Tijd
          </h2>
          <p className="text-muted-foreground text-lg">
            Ontdek Nederlandse muziek door de decennia heen
          </p>
        </motion.div>

        {/* Decade Selector */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {DECADES.map((decade, index) => (
              <motion.button
                key={decade.year}
                onClick={() => setActiveDecade(index)}
                className={`
                  relative px-4 py-2 rounded-full font-bold text-sm md:text-base
                  transition-all duration-300 whitespace-nowrap
                  ${activeDecade === index 
                    ? `bg-gradient-to-r ${decade.color} text-white shadow-lg scale-110` 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
                whileHover={{ scale: activeDecade === index ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {decade.year}
                {activeDecade === index && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-full bg-gradient-to-r opacity-20"
                    style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="outline" size="icon" onClick={prevDecade}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleAutoPlay}
              className={isPlaying ? "bg-primary text-primary-foreground" : ""}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={nextDecade}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Decade Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDecade}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`${currentDecade.gradient} border-2 border-opacity-30`}>
              <CardContent className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className={`text-4xl md:text-6xl font-black bg-gradient-to-r ${currentDecade.color} bg-clip-text text-transparent`}>
                    {currentDecade.label}
                  </h3>
                  <p className="text-muted-foreground mt-2">{currentDecade.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentDecade.artists.map((artist, index) => (
                    <motion.div
                      key={artist.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {artist.slug ? (
                        <Link to={`/artists/${artist.slug}`}>
                          <ArtistCard artist={artist} color={currentDecade.color} />
                        </Link>
                      ) : (
                        <ArtistCard artist={artist} color={currentDecade.color} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

const ArtistCard = ({ artist, color }: { artist: Artist; color: string }) => (
  <Card className="group h-full hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
    <CardContent className="p-4 text-center">
      <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Music className="w-8 h-8 text-white" />
      </div>
      <h4 className="font-bold text-sm md:text-base line-clamp-1">{artist.name}</h4>
      <p className="text-xs text-muted-foreground">{artist.genre}</p>
      {artist.hit && (
        <p className="text-xs text-primary mt-1 truncate">"{artist.hit}"</p>
      )}
    </CardContent>
  </Card>
);
