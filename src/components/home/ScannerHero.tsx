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
    <section className="relative min-h-[400px] md:min-h-[500px] bg-black overflow-hidden flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/30 via-black to-vinyl-gold/10" />
      
      {/* Animated vinyl disc - left */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-20 md:opacity-30">
        <Disc3 className="w-64 h-64 md:w-96 md:h-96 text-vinyl-purple animate-vinyl-spin" />
      </div>
      
      {/* Animated vinyl disc - right */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-10 md:opacity-20">
        <Disc3 className="w-48 h-48 md:w-72 md:h-72 text-vinyl-gold animate-vinyl-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>
      
      {/* Sparkle effects */}
      <Sparkles className="absolute top-20 left-[20%] w-6 h-6 text-vinyl-gold/50 animate-pulse" />
      <Sparkles className="absolute bottom-32 right-[25%] w-4 h-4 text-vinyl-purple/60 animate-pulse" style={{ animationDelay: '1s' }} />
      <Sparkles className="absolute top-1/3 right-[15%] w-5 h-5 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Content */}
      <div className="container relative z-10 py-12 md:py-20 text-center">
        {/* Badge */}
        <Badge 
          variant="outline" 
          className="bg-gradient-to-r from-vinyl-purple/20 to-vinyl-gold/20 border-vinyl-gold/50 text-white px-6 py-2 text-base md:text-lg font-semibold mb-8 backdrop-blur-sm"
        >
          <Camera className="w-5 h-5 mr-2 text-vinyl-gold" />
          Scan je collectie
        </Badge>

        {/* Main title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Hét Muziekplatform
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-10">
          Nieuws, verhalen, quizzen, podcasts en unieke muziekproducten
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {navButtons.map(({ icon: Icon, label, href }) => (
            <Button 
              key={href}
              asChild 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white px-5 py-5 md:px-6 md:py-6 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
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
