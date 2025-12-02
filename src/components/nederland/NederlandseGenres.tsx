import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Music, Headphones, Radio, Guitar, Mic, Disc3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNederlandseGenres } from "@/hooks/useNederlandseMuziek";

// Dutch genre information with icons and descriptions
const GENRE_INFO: Record<string, { icon: typeof Music; color: string; description: string; artists: string[] }> = {
  "Rock": {
    icon: Guitar,
    color: "hsl(0, 72%, 51%)",
    description: "Van Golden Earring tot De Dijk",
    artists: ["Golden Earring", "Herman Brood", "De Dijk", "Boudewijn de Groot"]
  },
  "Pop": {
    icon: Music,
    color: "hsl(280, 72%, 51%)",
    description: "Nederlandse pop in al zijn vormen",
    artists: ["Marco Borsato", "Guus Meeuwis", "Nick & Simon", "Davina Michelle"]
  },
  "Electronic": {
    icon: Headphones,
    color: "hsl(190, 72%, 51%)",
    description: "Nederland als EDM-wereldmacht",
    artists: ["Tiësto", "Armin van Buuren", "Martin Garrix", "Hardwell"]
  },
  "Symphonic Metal": {
    icon: Mic,
    color: "hsl(271, 81%, 56%)",
    description: "Epische metal met orkest",
    artists: ["Within Temptation", "Epica", "Delain", "After Forever"]
  },
  "Nederpop": {
    icon: Radio,
    color: "hsl(24, 100%, 50%)",
    description: "Nederlandstalige pop muziek",
    artists: ["Doe Maar", "Het Goede Doel", "Acda en de Munnik", "BLØF"]
  },
  "Schlager": {
    icon: Disc3,
    color: "hsl(45, 100%, 51%)",
    description: "Levenslied en volksmuziek",
    artists: ["André Hazes", "Frans Bauer", "Jan Smit", "Gerard Joling"]
  },
};

export function NederlandseGenres() {
  const { data: genres } = useNederlandseGenres();

  // Combine database genres with our genre info
  const displayGenres = Object.entries(GENRE_INFO).map(([name, info]) => {
    const dbGenre = genres?.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
    return {
      name,
      count: dbGenre?.count || 0,
      ...info
    };
  });

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Genres in{" "}
            <span className="text-[hsl(24,100%,50%)]">Nederland</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De rijke diversiteit van de Nederlandse muziekscene
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGenres.map((genre, index) => (
            <motion.div
              key={genre.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/artists?genre=${encodeURIComponent(genre.name.toLowerCase())}&country=nederland`}>
                <Card 
                  className="group p-6 h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-opacity-30 cursor-pointer"
                  style={{ 
                    '--hover-border-color': genre.color,
                    borderColor: 'transparent'
                  } as any}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = genre.color + '4D'; // 30% opacity
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="p-3 rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: genre.color + '20' }}
                  >
                    <genre.icon 
                      className="w-8 h-8" 
                      style={{ color: genre.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{genre.name}</h3>
                      {genre.count > 0 && (
                        <span 
                          className="text-sm font-medium px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: genre.color + '20',
                            color: genre.color 
                          }}
                        >
                          {genre.count}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      {genre.description}
                    </p>

                    {/* Artists */}
                    <div className="flex flex-wrap gap-1">
                      {genre.artists.slice(0, 3).map(artist => (
                        <span 
                          key={artist}
                          className="text-xs bg-muted px-2 py-1 rounded-md"
                        >
                          {artist}
                        </span>
                      ))}
                      {genre.artists.length > 3 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{genre.artists.length - 3} meer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative element */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: genre.color }}
                />
              </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Card className="inline-block p-6 bg-gradient-to-r from-[hsl(24,100%,50%)]/10 to-[hsl(211,100%,35%)]/10 border-dashed">
            <p className="text-lg">
              💡 <strong>Wist je dat?</strong> Nederland heeft meer #1 DJ's per inwoner dan enig ander land ter wereld!
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
