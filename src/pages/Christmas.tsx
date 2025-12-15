import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChristmasCountdown } from '@/components/christmas/ChristmasCountdown';
import { ChristmasRoyaltiesCalculator } from '@/components/christmas/ChristmasRoyaltiesCalculator';
import { ChristmasQuiz } from '@/components/christmas/ChristmasQuiz';
import { ChristmasRadioStream } from '@/components/christmas/ChristmasRadioStream';
import { ChristmasDecades } from '@/components/christmas/ChristmasDecades';
import { ChristmasPoll } from '@/components/christmas/ChristmasPoll';
import { ChristmasBehindTheClip } from '@/components/christmas/ChristmasBehindTheClip';
import ChristmasAnecdote from '@/components/christmas/ChristmasAnecdote';
import { ChristmasProducts } from '@/components/christmas/ChristmasProducts';
import { ChristmasShopProducts } from '@/components/christmas/ChristmasShopProducts';
import { ChristmasSocks } from '@/components/christmas/ChristmasSocks';
import { ChristmasPosters } from '@/components/christmas/ChristmasPosters';
import { ChristmasFeaturedStory } from '@/components/christmas/ChristmasFeaturedStory';
import { Link } from 'react-router-dom';
import { Music, Sparkles, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <meta name="description" content="Ontdek de mooiste kerstmuziek: klassiekers, verhalen achter videoclips, royalties van kerstliedjes en meer." />
        <meta property="og:title" content="🎄 Kerst Muziek Platform | MusicScan" />
        <meta property="og:description" content="Ontdek de mooiste kerstmuziek: klassiekers, verhalen achter videoclips en meer." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-red-950/5 to-green-950/5">
        {/* Snowfall Effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {snowflakes.map((style, i) => (
            <Snowflake key={i} style={style} />
          ))}
        </div>

        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-green-900/10 to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-red-600 to-green-600 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" /> Kerst Muziek
              </Badge>
              
              <motion.div
                className="text-6xl md:text-8xl mb-6"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                🎄
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                MusicScan Kerst Special 2025
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ontdek de magie van kerstmuziek! Van klassiekers tot moderne hits, 
                verhalen achter de videoclips en hoeveel artiesten verdienen.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Link to="/kerst-singles">
                  <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700">
                    <Music className="h-5 w-5 mr-2" /> Kerst Singles
                  </Button>
                </Link>
                <Link to="/kerst-posters">
                  <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-500/10">
                    🖼️ Kerst Posters
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#kerst-quiz">
                  <Button size="lg" variant="outline" className="border-red-500 text-red-600 hover:bg-red-500/10">
                    <Sparkles className="h-5 w-5 mr-2" /> Kerst Quiz
                  </Button>
                </a>
              </div>

              {/* Countdown Widget */}
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/50 max-w-md mx-auto">
                <ChristmasCountdown />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 pb-20 space-y-12 relative z-10">
          {/* Christmas Singles Link Card */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-red-500/5 pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-6 w-6 text-green-500" />
                <span className="bg-gradient-to-r from-green-500 to-red-500 bg-clip-text text-transparent">
                  200+ Kerst Singles
                </span>
                <span className="text-2xl">🎄</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-muted-foreground mb-4">
                Van Mariah Carey tot Wham!, van klassiekers tot moderne hits. Ontdek alle kerst singles met verhalen en artwork.
              </p>
              <Link to="/kerst-singles">
                <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 group">
                  Bekijk alle kerst singles
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Christmas Quiz - Prominent */}
          <div id="kerst-quiz">
            <ChristmasQuiz />
          </div>

          {/* Featured Story of the Day */}
          <ChristmasFeaturedStory />

          {/* Christmas Music Stories (filtered by tags) */}
          <ChristmasProducts />

          {/* Christmas Posters & Art Prints */}
          <ChristmasPosters />

          {/* Christmas Socks */}
          <ChristmasSocks />

          {/* Other Christmas Shop Products */}
          <ChristmasShopProducts />

          {/* Radio Stream */}
          <ChristmasRadioStream />

          {/* Daily Anecdote */}
          <ChristmasAnecdote />

          {/* Behind the Clip (Full Width) */}
          <ChristmasBehindTheClip />

          {/* Decades Timeline & Poll */}
          <div className="grid lg:grid-cols-2 gap-8">
            <ChristmasDecades />
            <ChristmasPoll />
          </div>

          {/* Royalties Calculator */}
          <ChristmasRoyaltiesCalculator />
        </section>

        <Footer />
      </div>
    </>
  );
}
