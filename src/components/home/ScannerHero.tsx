import { Link } from 'react-router-dom';
import { Camera, Disc3, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const ScannerHero = () => {
  const { t, tr } = useLanguage();
  const h = tr.homeUI;

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] bg-black overflow-hidden flex items-center -mt-14 pt-14">
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

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-24 text-center">
        
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-vinyl-gold/20 text-vinyl-gold px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-vinyl-gold/30">
            <Zap className="w-4 h-4" />
            {t('hero.badge')}
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 tracking-tight">
            {t('hero.title')}
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
            {t('hero.subtitle')}
          </p>
          
          {/* Big Scanner Button */}
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-vinyl-gold via-yellow-500 to-vinyl-gold hover:from-yellow-500 hover:via-vinyl-gold hover:to-yellow-500 text-black font-bold text-xl md:text-2xl px-10 md:px-14 py-8 md:py-10 rounded-2xl shadow-2xl shadow-vinyl-gold/40 hover:shadow-vinyl-gold/60 transition-all duration-300 hover:scale-105 group"
          >
            <Link to="/ai-scan-v2">
              <Camera className="w-7 h-7 md:w-8 md:h-8 mr-3" />
              {t('hero.cta')}
              <ArrowRight className="w-6 h-6 md:w-7 md:h-7 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          {/* 3-Step Strip */}
          <div className="mt-10 max-w-xl mx-auto grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <span className="text-2xl md:text-3xl mb-1 block">📷</span>
              <p className="text-white/90 text-xs md:text-sm font-medium">Maak een foto</p>
            </div>
            <div className="text-center">
              <span className="text-2xl md:text-3xl mb-1 block">🤖</span>
              <p className="text-white/90 text-xs md:text-sm font-medium">Slimme herkenning</p>
            </div>
            <div className="text-center">
              <span className="text-2xl md:text-3xl mb-1 block">💰</span>
              <p className="text-white/90 text-xs md:text-sm font-medium">Zie marktwaarde</p>
            </div>
          </div>

          <p className="text-vinyl-gold/80 text-sm md:text-base font-semibold mt-6 animate-pulse">
            {t('hero.promoCredits')}
          </p>
          <p className="text-white/50 text-xs mt-1">
            {t('hero.promoSub')}
          </p>
        </div>
      </div>
    </section>
  );
};
