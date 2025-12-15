import { Link } from 'react-router-dom';
import { Gift, Music, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ChristmasHeroBanner = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-christmas-burgundy via-christmas-red to-christmas-burgundy py-16 md:py-24 w-full">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 text-6xl animate-twinkle" style={{ animationDelay: '0s' }}>✨</div>
        <div className="absolute top-20 right-20 text-4xl animate-twinkle" style={{ animationDelay: '0.5s' }}>🎄</div>
        <div className="absolute bottom-20 left-1/4 text-5xl animate-twinkle" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-twinkle" style={{ animationDelay: '1.5s' }}>🎁</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-twinkle" style={{ animationDelay: '2s' }}>✨</div>
      </div>

      {/* Golden light overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-christmas-gold/10 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Christmas badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-christmas-gold/20 border border-christmas-gold/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-christmas-gold" />
            <span className="text-christmas-cream text-sm font-medium">Kerst op MusicScan</span>
            <Sparkles className="w-4 h-4 text-christmas-gold" />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-christmas-cream mb-6">
            <span className="text-christmas-gold">🎄</span> Warme Kerst{' '}
            <span className="bg-gradient-to-r from-christmas-gold to-yellow-400 bg-clip-text text-transparent">
              Muziek
            </span>
          </h1>

          <p className="text-lg md:text-xl text-christmas-cream/80 mb-8 max-w-2xl mx-auto">
            Ontdek de mooiste kerstverhalen, iconische kerstnummers en unieke muziekcadeaus voor onder de boom
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-christmas-gold hover:bg-christmas-gold/90 text-christmas-burgundy font-bold text-lg px-8"
            >
              <Link to="/kerst">
                <Music className="w-5 h-5 mr-2" />
                Kerstverhalen
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-christmas-cream/30 text-christmas-cream hover:bg-christmas-cream/10 text-lg px-8"
            >
              <Link to="/shop">
                <Gift className="w-5 h-5 mr-2" />
                Cadeauwinkel
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom decorative border */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-christmas-green via-christmas-gold to-christmas-red" />
    </section>
  );
};
