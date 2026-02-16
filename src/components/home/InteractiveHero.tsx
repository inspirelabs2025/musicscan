import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Disc3, Sparkles, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const InteractiveHero = () => {
  const [currentVariant, setCurrentVariant] = useState(0);
  const { user } = useAuth();
  const { tr } = useLanguage();
  const h = tr.homeUI;

  const heroVariants = [
    { id: 'scan', title: h.heroScanTitle, description: h.heroScanDesc, icon: Disc3, cta: h.heroScanCTA, ctaLink: '/auth', gradient: 'from-red-600/15 to-green-600/15', stats: h.heroScanStats },
    { id: 'ai', title: h.heroAITitle, description: h.heroAIDesc, icon: Sparkles, cta: h.heroAICTA, ctaLink: '/collection-chat', gradient: 'from-accent/20 to-primary/20', stats: h.heroAIStats },
    { id: 'story', title: h.heroStoryTitle, description: h.heroStoryDesc, icon: BookOpen, cta: h.heroStoryCTA, ctaLink: '/news?filter=verhalen', gradient: 'from-vinyl-gold/20 to-vinyl-silver/20', stats: h.heroStoryStats },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVariant((prev) => (prev + 1) % heroVariants.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroVariants.length]);

  const variant = heroVariants[currentVariant];
  const Icon = variant.icon;

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${variant.gradient} transition-all duration-1000`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="flex justify-center">
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
              <Icon className="w-16 h-16 text-primary animate-scan-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{variant.title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{variant.description}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" /><span>{variant.stats}</span>
          </div>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Button asChild size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
              <Link to={user ? variant.ctaLink : '/auth'}>{variant.cta}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link to="/forum">{h.browseCommunity}</Link>
            </Button>
          </div>
          <div className="flex gap-2 justify-center mt-8">
            {heroVariants.map((_, index) => (
              <button key={index} onClick={() => setCurrentVariant(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentVariant ? 'w-8 bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} aria-label={`View variant ${index + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
