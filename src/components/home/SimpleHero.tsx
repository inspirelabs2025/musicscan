import { Link } from 'react-router-dom';
import { Newspaper, BookOpen, ShoppingBag, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SimpleHero = () => {
  const ctaCards = [
    {
      icon: Newspaper,
      title: 'Nieuws',
      subtitle: 'Lezen',
      description: 'Laatste muzieknieuws',
      href: '/nieuws',
      gradient: 'from-christmas-red to-christmas-burgundy'
    },
    {
      icon: BookOpen,
      title: 'Verhalen',
      subtitle: 'Ontdek',
      description: 'Plaat & Verhaal',
      href: '/verhalen',
      gradient: 'from-christmas-gold to-amber-500'
    },
    {
      icon: ShoppingBag,
      title: 'Shop',
      subtitle: 'Ontdek',
      description: 'Gebruikerswinkels',
      href: '/shops',
      gradient: 'from-christmas-green to-christmas-pine'
    },
    {
      icon: Palette,
      title: 'Art',
      subtitle: 'Kopen',
      description: 'Metaalprints & Posters',
      href: '/art-shop',
      gradient: 'from-christmas-burgundy to-christmas-red'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-christmas-cream dark:bg-christmas-burgundy/20">
      {/* Background texture */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Warm glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-christmas-gold/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-christmas-red/15 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-christmas-gold/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
          <h1 className="text-3xl md:text-6xl font-bold text-christmas-burgundy dark:text-christmas-cream">
            🎄 Jouw Muziekplatform
          </h1>
          <p className="text-base md:text-2xl text-christmas-burgundy/70 dark:text-christmas-cream/70">
            Voor Nieuws, Verhalen, Shops & Art
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
          {ctaCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.href} className="block">
                <Card className="p-4 md:p-8 text-center hover:shadow-2xl transition-all hover:scale-105 group cursor-pointer relative overflow-hidden border-2 border-christmas-gold/20 hover:border-christmas-gold bg-white/80 dark:bg-christmas-burgundy/30 backdrop-blur h-full">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-15 transition-opacity`} />

                  <div className="relative z-10 space-y-3 md:space-y-4">
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base md:text-2xl font-bold mb-0.5 md:mb-1 text-christmas-burgundy dark:text-christmas-cream">{card.title}</h3>
                      <p className="text-sm md:text-lg text-christmas-gold font-semibold">{card.subtitle}</p>
                      <p className="hidden md:block text-sm text-christmas-burgundy/60 dark:text-christmas-cream/60 mt-2">{card.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
