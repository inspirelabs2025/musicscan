import { Link } from 'react-router-dom';
import { Newspaper, BookOpen, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SimpleHero = () => {
  const ctaCards = [
    {
      icon: Newspaper,
      title: 'Nieuws',
      subtitle: 'Lezen',
      description: 'Laatste muzieknieuws',
      href: '/news',
      gradient: 'from-vinyl-purple to-accent'
    },
    {
      icon: BookOpen,
      title: 'Verhalen',
      subtitle: 'Ontdek',
      description: 'Plaat & Verhaal',
      href: '/news?filter=verhalen',
      gradient: 'from-vinyl-gold to-amber-500'
    },
    {
      icon: ShoppingBag,
      title: 'Shop',
      subtitle: 'Kopen',
      description: 'Vinyl, CD\'s & Art',
      href: '/shop',
      gradient: 'from-primary to-vinyl-purple'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-vinyl-purple/20 via-background to-background">
      {/* Background texture */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Floating vinyl records animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-vinyl-gold/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-vinyl-purple/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            🎵 Jouw Muziekplatform
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Voor Nieuws, Verhalen & Vinyl
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {ctaCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.href}>
                <Card className="p-8 text-center hover:shadow-2xl transition-all hover:scale-105 group cursor-pointer relative overflow-hidden border-2 hover:border-primary">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{card.title}</h3>
                      <p className="text-lg text-vinyl-gold font-semibold">{card.subtitle}</p>
                      <p className="text-sm text-muted-foreground mt-2">{card.description}</p>
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
