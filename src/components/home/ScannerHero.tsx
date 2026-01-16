import { Link } from 'react-router-dom';
import { Camera, Disc3, Sparkles, Newspaper, BookOpen, Gamepad2, Podcast, ShoppingBag, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navButtons = [
  { icon: Newspaper, label: 'Nieuws', href: '/nieuws' },
  { icon: BookOpen, label: 'Verhalen', href: '/verhalen' },
  { icon: Gamepad2, label: 'Quiz', href: '/quizzen' },
  { icon: Podcast, label: 'Podcast', href: '/podcasts' },
  { icon: ShoppingBag, label: 'Producten', href: '/shop' },
];

export const ScannerHero = () => {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] bg-black overflow-hidden flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/50 via-black to-vinyl-gold/30" />
      
      {/* Animated vinyl disc - left */}
      <div className="absolute -left-10 md:-left-20 top-1/2 -translate-y-1/2 opacity-30 md:opacity-40">
        <Disc3 className="w-72 h-72 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] text-vinyl-purple animate-vinyl-spin" />
      </div>
      
      {/* Animated vinyl disc - right */}
      <div className="absolute -right-10 md:-right-20 top-1/2 -translate-y-1/2 opacity-20 md:opacity-30">
        <Disc3 className="w-56 h-56 md:w-80 md:h-80 lg:w-96 lg:h-96 text-vinyl-gold animate-vinyl-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>
      
      {/* Sparkle effects */}
      <Sparkles className="absolute top-20 left-[20%] w-8 h-8 text-vinyl-gold/60 animate-pulse" />
      <Sparkles className="absolute bottom-32 right-[25%] w-6 h-6 text-vinyl-purple/70 animate-pulse" style={{ animationDelay: '1s' }} />
      <Sparkles className="absolute top-1/3 right-[15%] w-7 h-7 text-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-24 lg:py-32 text-center">
        
        {/* MAIN SCANNER CTA - Hero focus */}
        <div className="mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-vinyl-gold/20 text-vinyl-gold px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-vinyl-gold/30">
            <Zap className="w-4 h-4" />
            Ontdek de waarde van je vinyl & CD's
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 tracking-tight">
            Scan Je Collectie
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
            Maak een foto en ontdek direct artiest, album én marktwaarde
          </p>
          
          {/* Big Scanner Button */}
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-vinyl-gold via-yellow-500 to-vinyl-gold hover:from-yellow-500 hover:via-vinyl-gold hover:to-yellow-500 text-black font-bold text-xl md:text-2xl px-10 md:px-14 py-8 md:py-10 rounded-2xl shadow-2xl shadow-vinyl-gold/40 hover:shadow-vinyl-gold/60 transition-all duration-300 hover:scale-105 group"
          >
            <Link to="/scanner">
              <Camera className="w-7 h-7 md:w-8 md:h-8 mr-3" />
              Start Scannen
              <ArrowRight className="w-6 h-6 md:w-7 md:h-7 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <p className="text-white/50 text-sm mt-4">
            Gratis • Geen account nodig • Direct resultaat
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-white/30" />
          <span className="text-white/50 text-sm font-medium">OF ONTDEK</span>
          <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-white/30" />
        </div>

        {/* Secondary Navigation buttons */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {navButtons.map(({ icon: Icon, label, href }) => (
            <Button 
              key={href}
              asChild 
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/15 hover:text-white hover:border-white/40 px-5 py-5 md:px-6 md:py-6 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
            >
              <Link to={href}>
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};
