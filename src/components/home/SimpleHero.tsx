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
      gradient: 'from-red-600 to-red-800',
      christmasIcon: '📰'
    },
    {
      icon: BookOpen,
      title: 'Verhalen',
      subtitle: 'Ontdek',
      description: 'Plaat & Verhaal',
      href: '/verhalen',
      gradient: 'from-green-600 to-green-800',
      christmasIcon: '📖'
    },
    {
      icon: ShoppingBag,
      title: 'Shop',
      subtitle: 'Ontdek',
      description: 'Gebruikerswinkels',
      href: '/shops',
      gradient: 'from-red-700 to-red-900',
      christmasIcon: '🎁'
    },
    {
      icon: Palette,
      title: 'Art',
      subtitle: 'Kopen',
      description: 'Metaalprints & Posters',
      href: '/art-shop',
      gradient: 'from-green-700 to-green-900',
      christmasIcon: '🎨'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-green-50/50 to-red-50/50 dark:from-green-950/20 dark:to-red-950/20">
      {/* Background texture */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Subtle glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-green-400/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-red-400/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
          <h1 className="text-3xl md:text-6xl font-bold text-green-900 dark:text-green-100 flex items-center justify-center gap-3">
            <span className="text-red-600">🎄</span>
            Jouw Muziekplatform
            <span className="text-red-600">🎄</span>
          </h1>
          <p className="text-base md:text-2xl text-green-800/70 dark:text-green-200/70">
            Voor Nieuws, Verhalen, Shops & Art
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
          {ctaCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.href} className="block">
                <Card className="p-4 md:p-8 text-center hover:shadow-2xl transition-all hover:scale-105 group cursor-pointer relative overflow-hidden border-2 border-green-200/50 hover:border-red-400 dark:border-green-800/50 dark:hover:border-red-500 bg-white/80 dark:bg-green-950/30 backdrop-blur h-full">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

                  <div className="relative z-10 space-y-3 md:space-y-4">
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base md:text-2xl font-bold mb-0.5 md:mb-1 text-green-900 dark:text-green-100">{card.title}</h3>
                      <p className="text-sm md:text-lg text-red-600 dark:text-red-400 font-semibold">{card.subtitle}</p>
                      <p className="hidden md:block text-sm text-green-800/60 dark:text-green-200/60 mt-2">{card.description}</p>
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
