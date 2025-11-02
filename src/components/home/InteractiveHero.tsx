import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Disc3, Sparkles, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const heroVariants = [
  {
    id: 'scan',
    title: 'Ontdek de Waarde van je Collectie',
    description: 'Scan je platen en cd\'s in seconden met AI. Ontdek verhalen, prijzen en meer.',
    icon: Disc3,
    cta: 'Start met Scannen',
    ctaLink: '/auth',
    gradient: 'from-vinyl-purple/20 to-vinyl-gold/20',
    stats: '10.000+ albums gescand'
  },
  {
    id: 'ai',
    title: 'AI-Powered Muziek Discovery',
    description: 'Praat met je collectie, genereer verhalen en ontdek je muziek DNA.',
    icon: Sparkles,
    cta: 'Probeer AI Chat',
    ctaLink: '/collection-chat',
    gradient: 'from-accent/20 to-primary/20',
    stats: '500+ AI analyses'
  },
  {
    id: 'story',
    title: 'Plaat & Verhaal',
    description: 'Duizenden verhalen over iconische albums en artiesten. Elke dag nieuw.',
    icon: BookOpen,
    cta: 'Lees Verhalen',
    ctaLink: '/news?filter=verhalen',
    gradient: 'from-vinyl-gold/20 to-vinyl-silver/20',
    stats: '1.000+ verhalen'
  }
];

export const InteractiveHero = () => {
  const [currentVariant, setCurrentVariant] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVariant((prev) => (prev + 1) % heroVariants.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const variant = heroVariants[currentVariant];
  const Icon = variant.icon;

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${variant.gradient} transition-all duration-1000`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-vinyl-purple/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-vinyl-gold/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
              <Icon className="w-16 h-16 text-primary animate-scan-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {variant.title}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {variant.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{variant.stats}</span>
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 shadow-lg hover:shadow-xl transition-all"
            >
              <Link to={user ? variant.ctaLink : '/auth'}>
                {variant.cta}
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
            >
              <Link to="/forum">
                Browse Community
              </Link>
            </Button>
          </div>

          {/* Variant indicators */}
          <div className="flex gap-2 justify-center mt-8">
            {heroVariants.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVariant(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentVariant 
                    ? 'w-8 bg-primary' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`View variant ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
