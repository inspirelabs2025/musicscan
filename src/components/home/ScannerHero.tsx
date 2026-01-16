import { Link } from 'react-router-dom';
import { Camera, Disc3, Sparkles, Newspaper, BookOpen, Gamepad2, Podcast, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navButtons = [
  { icon: Newspaper, label: 'Nieuws', href: '/nieuws' },
  { icon: BookOpen, label: 'Verhalen', href: '/verhalen' },
  { icon: Gamepad2, label: 'Quiz', href: '/quizzen' },
  { icon: Podcast, label: 'Podcast', href: '/podcasts' },
  { icon: ShoppingBag, label: 'Producten', href: '/shop' },
];

export const ScannerHero = () => {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] lg:min-h-[700px] bg-black overflow-hidden flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/40 via-black to-vinyl-gold/20" />
      
      {/* Animated vinyl disc - left */}
      <div className="absolute -left-10 md:-left-20 top-1/2 -translate-y-1/2 opacity-30 md:opacity-40">
        <Disc3 className="w-72 h-72 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] text-vinyl-purple animate-vinyl-spin" />
      </div>
      
      {/* Animated vinyl disc - right */}
      <div className="absolute -right-10 md:-right-20 top-1/2 -translate-y-1/2 opacity-20 md:opacity-30">
        <Disc3 className="w-56 h-56 md:w-80 md:h-80 lg:w-96 lg:h-96 text-vinyl-gold animate-vinyl-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>
      
      {/* Sparkle effects */}
      <Sparkles className="absolute top-20 left-[20%] w-6 h-6 text-vinyl-gold/50 animate-pulse" />
      <Sparkles className="absolute bottom-32 right-[25%] w-4 h-4 text-vinyl-purple/60 animate-pulse" style={{ animationDelay: '1s' }} />
      <Sparkles className="absolute top-1/3 right-[15%] w-5 h-5 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-24 lg:py-32 text-center">
        {/* Badge */}
        <Badge 
          variant="outline" 
          className="bg-gradient-to-r from-vinyl-purple/30 to-vinyl-gold/30 border-vinyl-gold/60 text-white px-8 py-3 text-lg md:text-xl font-bold mb-10 backdrop-blur-md shadow-lg shadow-vinyl-purple/20"
        >
          <Camera className="w-6 h-6 mr-3 text-vinyl-gold" />
          Scan je collectie
        </Badge>

        {/* Main title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 tracking-tight bg-gradient-to-r from-white via-white to-vinyl-gold/80 bg-clip-text">
          Hét Muziekplatform
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto mb-12 font-medium">
          Nieuws, verhalen, quizzen, podcasts en unieke muziekproducten
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {navButtons.map(({ icon: Icon, label, href }) => (
            <Button 
              key={href}
              asChild 
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/25 hover:text-white hover:border-vinyl-gold/50 px-6 py-6 md:px-8 md:py-7 rounded-2xl backdrop-blur-md transition-all hover:scale-105 shadow-lg shadow-black/20 text-base md:text-lg font-semibold"
            >
              <Link to={href}>
                <Icon className="w-5 h-5 md:w-6 md:h-6 mr-2.5" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};
