import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChristmasCountdown } from '@/components/christmas/ChristmasCountdown';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  Gift, Music, Calendar, Star, MapPin, Play, 
  Clock, Sparkles, Heart, TreePine
} from 'lucide-react';

interface ChristmasSong {
  id: string;
  artist: string;
  song_title: string;
  year: number | null;
  country_origin: string | null;
  decade: string | null;
  is_classic: boolean;
  youtube_video_id: string | null;
  music_story_id: string | null;
}

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    className="absolute text-white/20 pointer-events-none select-none"
    style={style}
    animate={{
      y: [0, 800],
      x: [0, Math.random() * 100 - 50],
      rotate: [0, 360],
      opacity: [0.7, 0],
    }}
    transition={{
      duration: Math.random() * 10 + 10,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    ❄
  </motion.div>
);

export default function Christmas() {
  const [songs, setSongs] = useState<ChristmasSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('christmas_import_queue')
        .select('*')
        .eq('status', 'completed')
        .order('is_classic', { ascending: false })
        .limit(12);
      
      setSongs(data || []);
      setIsLoading(false);
    };

    fetchSongs();
  }, []);

  const snowflakes = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `-${Math.random() * 100}px`,
    fontSize: `${Math.random() * 20 + 10}px`,
    animationDelay: `${Math.random() * 5}s`,
  }));

  return (
    <>
      <Helmet>
        <title>🎄 Kerst Muziek Platform | MusicScan</title>
        <meta name="description" content="Ontdek de mooiste kerstmuziek: klassiekers, verhalen, advent kalender, quiz en meer. Van Wham! tot Mariah Carey - alles over kerstliedjes." />
        <meta property="og:title" content="🎄 Kerst Muziek Platform | MusicScan" />
        <meta property="og:description" content="Ontdek de mooiste kerstmuziek: klassiekers, verhalen, advent kalender, quiz en meer." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen relative overflow-hidden">
        {/* Snowfall Effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {snowflakes.map((style, i) => (
            <Snowflake key={i} style={style} />
          ))}
        </div>

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-green-900/10 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="text-6xl md:text-8xl mb-6"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                🎄
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                Kerst Muziek Platform
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ontdek de magie van kerstmuziek. Van tijdloze klassiekers tot verrassende 
                verhalen - alles wat je wilt weten over de mooiste kerstliedjes.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <Music className="w-3 h-3 mr-1" /> Klassiekers
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-400">
                  <Calendar className="w-3 h-3 mr-1" /> Advent Kalender
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                  <Star className="w-3 h-3 mr-1" /> Verhalen
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400">
                  <MapPin className="w-3 h-3 mr-1" /> Wereldkaart
                </Badge>
              </div>

              {/* Countdown */}
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50">
                <ChristmasCountdown />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Songs Grid */}
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Gift className="w-6 h-6 text-red-500" />
                  Kerst Klassiekers
                </h2>
                <p className="text-muted-foreground">De mooiste kerstliedjes met hun verhalen</p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3" />
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : songs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {songs.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-4">
                        {/* Placeholder artwork */}
                        <div className="aspect-square bg-gradient-to-br from-red-500/20 to-green-500/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          <TreePine className="w-12 h-12 text-green-500/50" />
                          {song.youtube_video_id && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          )}
                          {song.is_classic && (
                            <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                              <Star className="w-3 h-3 mr-1" /> Klassieker
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold line-clamp-1">{song.song_title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{song.artist}</p>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {song.year && <span>{song.year}</span>}
                          {song.country_origin && (
                            <>
                              <span>•</span>
                              <span>{song.country_origin}</span>
                            </>
                          )}
                        </div>

                        {song.music_story_id && (
                          <Button variant="link" className="px-0 mt-2 h-auto text-sm" asChild>
                            <Link to={`/singles/${song.artist.toLowerCase().replace(/\s+/g, '-')}-${song.song_title.toLowerCase().replace(/\s+/g, '-')}`}>
                              Lees verhaal →
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">Binnenkort beschikbaar!</h3>
                  <p className="text-muted-foreground">
                    We zijn nog bezig met het toevoegen van kerstverhalen. 
                    Kom snel terug voor meer content!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Coming Soon Features */}
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Binnenkort Beschikbaar
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Calendar, title: 'Advent Kalender', desc: '24 dagen kerst content' },
                { icon: MapPin, title: 'Kerst Wereldkaart', desc: 'Tradities over de hele wereld' },
                { icon: Music, title: 'Door de Decennia', desc: 'Kerstmuziek door de jaren heen' },
                { icon: Star, title: 'Kerst Quiz', desc: 'Test je kerst kennis' },
                { icon: Gift, title: 'Memory Game', desc: 'Match de albumcovers' },
                { icon: Heart, title: 'Kerst Poll', desc: 'Stem op je favorieten' },
              ].map((feature, i) => (
                <Card key={i} className="bg-card/50 border-dashed opacity-75">
                  <CardContent className="p-4 flex items-center gap-3">
                    <feature.icon className="w-8 h-8 text-primary/50" />
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">Soon</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
