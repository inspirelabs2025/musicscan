import { Link } from 'react-router-dom';
import { Camera, Disc3, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const ScannerHero = () => {
  const { t, tr } = useLanguage();
  const h = tr.homeUI;

  return (
    <section className="scanner-hero relative min-h-[400px] md:min-h-[600px] bg-black overflow-hidden flex items-center -mt-14 pt-14">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/50 via-black to-vinyl-gold/30" />
      
      {/* Animated vinyl disc - left */}
      <div className="absolute -left-16 md:-left-20 top-1/2 -translate-y-1/2 opacity-20 md:opacity-40">
        <Disc3 className="w-48 h-48 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] text-vinyl-purple animate-vinyl-spin" />
      </div>
      
      {/* Animated vinyl disc - right */}
      <div className="absolute -right-16 md:-right-20 top-1/2 -translate-y-1/2 opacity-10 md:opacity-30">
        <Disc3 className="w-40 h-40 md:w-80 md:h-80 lg:w-96 lg:h-96 text-vinyl-gold animate-vinyl-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 py-10 md:py-24 text-center w-full">
        
        <div className="mb-6 md:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-vinyl-gold/20 text-vinyl-gold px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6 backdrop-blur-sm border border-vinyl-gold/30">
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('hero.badge')}
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-3 md:mb-6 tracking-tight leading-tight">
            Scan Je Vinyl & CD Collectie
          </h1>
          
          <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto mb-6 md:mb-10">
            Ontdek de Waarde van je Platen met AI
          </h2>
          
          {/* Big Scanner Button */}
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-vinyl-gold via-yellow-500 to-vinyl-gold hover:from-yellow-500 hover:via-vinyl-gold hover:to-yellow-500 text-black font-bold text-base md:text-2xl px-8 md:px-14 py-6 md:py-10 rounded-2xl shadow-2xl shadow-vinyl-gold/40 hover:shadow-vinyl-gold/60 transition-all duration-300 hover:scale-105 group min-h-[48px]"
          >
            <Link to="/ai-scan-v2">
              <Camera className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3" />
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 md:w-7 md:h-7 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          {/* 3-Step Strip */}
          <div className="mt-6 md:mt-10 max-w-md md:max-w-2xl mx-auto grid grid-cols-3 gap-2 md:gap-5 items-start">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 mb-1.5 md:mb-2 mx-auto w-fit">
                <span className="text-2xl md:text-4xl block">📷</span>
              </div>
              <p className="text-white/90 text-[11px] md:text-sm font-medium">Maak een foto</p>
            </div>
            <div className="text-center relative">
              <span className="absolute -left-2 md:-left-6 top-3 md:top-6 text-white/40 text-sm md:text-xl font-bold">→</span>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 mb-1.5 md:mb-2 mx-auto w-fit">
                <span className="text-2xl md:text-4xl block">🤖</span>
              </div>
              <p className="text-white/90 text-[11px] md:text-sm font-medium">Slimme herkenning</p>
            </div>
            <div className="text-center relative">
              <span className="absolute -left-2 md:-left-6 top-3 md:top-6 text-white/40 text-sm md:text-xl font-bold">→</span>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 mb-1.5 md:mb-2 mx-auto w-fit">
                <span className="text-2xl md:text-4xl block">💰</span>
              </div>
              <p className="text-white/90 text-[11px] md:text-sm font-medium">Zie marktwaarde</p>
            </div>
          </div>

          <p className="text-vinyl-gold/80 text-xs md:text-base font-semibold mt-4 md:mt-6 animate-pulse">
            {t('hero.promoCredits')}
          </p>
          <p className="text-white/50 text-[10px] md:text-xs mt-1">
            {t('hero.promoSub')}
          </p>
        </div>
      </div>
    </section>
  );
};
