import { Link } from 'react-router-dom';
import { Camera, Disc3, ScanLine, BadgeCheck, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Disc3, label: 'Vinyl Analyse' },
  { icon: ScanLine, label: 'CD Herkenning' },
  { icon: BadgeCheck, label: 'Matrix Check' },
  { icon: TrendingUp, label: 'Prijscheck' },
];

export const ScannerHero = () => {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] bg-black overflow-hidden flex items-center">
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
      <div className="container relative z-10 py-16 md:py-24 text-center">
        {/* Camera icon with glow */}
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-vinyl-purple/40 blur-2xl rounded-full scale-150" />
          <div className="relative bg-gradient-to-br from-vinyl-purple to-vinyl-gold p-5 md:p-6 rounded-2xl">
            <Camera className="w-10 h-10 md:w-14 md:h-14 text-white" />
          </div>
        </div>

        {/* Main title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
          Scan je Collectie
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
          Ontdek de waarde van je vinyl & CD's met onze slimme scanner. 
          Matrix verificatie, prijsanalyse en meer.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
          {features.map(({ icon: Icon, label }) => (
            <Badge 
              key={label}
              variant="outline" 
              className="bg-white/5 border-white/20 text-white/90 px-3 py-1.5 md:px-4 md:py-2 text-sm backdrop-blur-sm"
            >
              <Icon className="w-4 h-4 mr-2 text-vinyl-gold" />
              {label}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 md:gap-16 mb-10">
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-white">10.000+</div>
            <div className="text-sm md:text-base text-white/50">Items gescand</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-vinyl-gold">99%</div>
            <div className="text-sm md:text-base text-white/50">Matrix verificatie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-white">Gratis</div>
            <div className="text-sm md:text-base text-white/50">Te gebruiken</div>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          asChild 
          size="lg" 
          className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:from-vinyl-purple/90 hover:to-vinyl-gold/90 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-vinyl-purple/30"
        >
          <Link to="/scanner">
            <Camera className="w-5 h-5 mr-2" />
            Start Scannen
          </Link>
        </Button>
      </div>
    </section>
  );
};
