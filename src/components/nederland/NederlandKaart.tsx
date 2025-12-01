import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Music, User } from "lucide-react";
import { Link } from "react-router-dom";

interface ProvinceArtist {
  name: string;
  city: string;
  genre: string;
  slug?: string;
}

interface Province {
  id: string;
  name: string;
  artists: ProvinceArtist[];
  path: string;
  labelX: number;
  labelY: number;
}

const PROVINCES: Province[] = [
  {
    id: "groningen",
    name: "Groningen",
    artists: [
      { name: "Ede Staal", city: "Groningen", genre: "Dialect" }
    ],
    path: "M140,20 L180,15 L200,40 L190,70 L150,80 L130,60 Z",
    labelX: 160, labelY: 45
  },
  {
    id: "friesland",
    name: "Friesland",
    artists: [
      { name: "Piter Wilkens", city: "Leeuwarden", genre: "Fries" }
    ],
    path: "M60,25 L130,20 L140,60 L130,80 L70,75 L50,50 Z",
    labelX: 90, labelY: 50
  },
  {
    id: "drenthe",
    name: "Drenthe",
    artists: [
      { name: "Skik", city: "Assen", genre: "Rock" }
    ],
    path: "M130,60 L190,70 L185,110 L140,115 L125,90 Z",
    labelX: 155, labelY: 90
  },
  {
    id: "overijssel",
    name: "Overijssel",
    artists: [
      { name: "Normaal", city: "Hengelo", genre: "Dialect Rock" }
    ],
    path: "M140,115 L185,110 L200,140 L190,175 L150,170 L135,140 Z",
    labelX: 165, labelY: 145
  },
  {
    id: "flevoland",
    name: "Flevoland",
    artists: [
      { name: "VanVelzen", city: "Almere", genre: "Pop" }
    ],
    path: "M95,110 L130,105 L135,140 L120,160 L95,150 Z",
    labelX: 112, labelY: 130
  },
  {
    id: "gelderland",
    name: "Gelderland",
    artists: [
      { name: "DI-RECT", city: "Arnhem", genre: "Rock" }
    ],
    path: "M135,140 L190,135 L210,180 L180,220 L130,210 L120,170 Z",
    labelX: 160, labelY: 180
  },
  {
    id: "utrecht",
    name: "Utrecht",
    artists: [
      { name: "Kensington", city: "Utrecht", genre: "Indie Rock" }
    ],
    path: "M85,150 L120,145 L125,175 L100,195 L80,180 Z",
    labelX: 100, labelY: 170
  },
  {
    id: "noord-holland",
    name: "Noord-Holland",
    artists: [
      { name: "André Hazes", city: "Amsterdam", genre: "Levenslied", slug: "andre-hazes" },
      { name: "BLØF", city: "Hoorn", genre: "Pop Rock" }
    ],
    path: "M40,60 L70,55 L85,90 L95,150 L80,180 L55,175 L35,130 L30,90 Z",
    labelX: 60, labelY: 120
  },
  {
    id: "zuid-holland",
    name: "Zuid-Holland",
    artists: [
      { name: "Golden Earring", city: "Den Haag", genre: "Rock", slug: "golden-earring" },
      { name: "Tiësto", city: "Breda", genre: "EDM", slug: "tiesto" }
    ],
    path: "M35,175 L80,180 L90,220 L70,260 L30,250 L25,210 Z",
    labelX: 55, labelY: 215
  },
  {
    id: "zeeland",
    name: "Zeeland",
    artists: [
      { name: "BLØF", city: "Vlissingen", genre: "Pop Rock" }
    ],
    path: "M10,250 L50,245 L55,290 L30,310 L5,290 Z",
    labelX: 30, labelY: 275
  },
  {
    id: "noord-brabant",
    name: "Noord-Brabant",
    artists: [
      { name: "Guus Meeuwis", city: "Tilburg", genre: "Pop" },
      { name: "Tiësto", city: "Breda", genre: "Trance", slug: "tiesto" }
    ],
    path: "M55,250 L130,240 L170,260 L160,300 L90,310 L50,290 Z",
    labelX: 110, labelY: 275
  },
  {
    id: "limburg",
    name: "Limburg",
    artists: [
      { name: "André Rieu", city: "Maastricht", genre: "Classical" },
      { name: "Rowwen Hèze", city: "Venlo", genre: "Dialect" }
    ],
    path: "M170,260 L200,250 L210,290 L195,350 L165,340 L160,300 Z",
    labelX: 185, labelY: 300
  }
];

export const NederlandKaart = () => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  const currentProvince = PROVINCES.find(p => p.id === hoveredProvince) || selectedProvince;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🗺️ Ontdek Per Provincie
          </h2>
          <p className="text-muted-foreground text-lg">
            Klik op een provincie om lokale artiesten te ontdekken
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Map SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <svg
              viewBox="0 0 220 360"
              className="w-full max-w-md mx-auto"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.1))" }}
            >
              {/* Background glow */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="provinceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4"/>
                </linearGradient>
                <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.7"/>
                </linearGradient>
              </defs>

              {PROVINCES.map((province) => (
                <g key={province.id}>
                  <motion.path
                    d={province.path}
                    fill={hoveredProvince === province.id || selectedProvince?.id === province.id 
                      ? "url(#hoverGradient)" 
                      : "url(#provinceGradient)"
                    }
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredProvince(province.id)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => setSelectedProvince(province)}
                    whileHover={{ scale: 1.02 }}
                    filter={hoveredProvince === province.id ? "url(#glow)" : "none"}
                  />
                  {/* Province label */}
                  <text
                    x={province.labelX}
                    y={province.labelY}
                    textAnchor="middle"
                    className="text-[8px] fill-primary-foreground font-medium pointer-events-none select-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                  >
                    {province.name.substring(0, 3)}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoveredProvince && !selectedProvince && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border rounded-lg px-4 py-2 shadow-lg"
                >
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {PROVINCES.find(p => p.id === hoveredProvince)?.name}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Province Details */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {currentProvince ? (
                <motion.div
                  key={currentProvince.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{currentProvince.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {currentProvince.artists.length} bekende {currentProvince.artists.length === 1 ? 'artiest' : 'artiesten'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {currentProvince.artists.map((artist, index) => (
                          <motion.div
                            key={artist.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {artist.slug ? (
                              <Link to={`/artists/${artist.slug}`}>
                                <ArtistRow artist={artist} />
                              </Link>
                            ) : (
                              <ArtistRow artist={artist} />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center text-muted-foreground"
                >
                  <MapPin className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg">Klik op een provincie</p>
                  <p className="text-sm">om artiesten uit die regio te zien</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const ArtistRow = ({ artist }: { artist: ProvinceArtist }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
      <User className="w-5 h-5 text-primary-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold group-hover:text-primary transition-colors">{artist.name}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Music className="w-3 h-3" />
        {artist.genre} • {artist.city}
      </p>
    </div>
  </div>
);
