import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChristmasCountdown } from '@/components/christmas/ChristmasCountdown';
import { ChristmasRoyaltiesCalculator } from '@/components/christmas/ChristmasRoyaltiesCalculator';
import { ChristmasCardGenerator } from '@/components/christmas/ChristmasCardGenerator';
import { ChristmasRadioStream } from '@/components/christmas/ChristmasRadioStream';
import { ChristmasDecades } from '@/components/christmas/ChristmasDecades';
import { ChristmasPoll } from '@/components/christmas/ChristmasPoll';
import { ChristmasBehindTheClip } from '@/components/christmas/ChristmasBehindTheClip';
import ChristmasAnecdote from '@/components/christmas/ChristmasAnecdote';
import { Link } from 'react-router-dom';
import { Music, Sparkles } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

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
        <Navigation />
        
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
                <Sparkles className="h-3 w-3 mr-1" /> MusicScan Kerst Special 2024
              </Badge>
              
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
                Ontdek de magie van kerstmuziek! Van klassiekers tot moderne hits, 
                verhalen achter de videoclips en hoeveel artiesten verdienen.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Link to="/quizzen">
                  <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700">
                    <Music className="h-5 w-5 mr-2" /> Kerst Quiz
                  </Button>
                </Link>
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

          {/* Royalties Calculator & Card Generator */}
          <div className="grid lg:grid-cols-2 gap-8">
            <ChristmasRoyaltiesCalculator />
            <ChristmasCardGenerator />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
