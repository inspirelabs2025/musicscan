import { Link } from 'react-router-dom';
import { Camera, Search, MessageCircle, Brain, TrendingUp, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export const AIFeaturesCompact = () => {
  const { tr } = useLanguage();
  const h = tr.homeUI;

  const features = [
    { icon: Camera, title: h.scanCollection, description: h.smartRecognition, href: '/scanner', badge: h.free, gradient: 'from-red-600 to-red-800' },
    { icon: Search, title: h.priceCheck, description: h.currentValues, href: '/quick-price-check', badge: '€0,99/scan', gradient: 'from-vinyl-gold to-amber-500' },
    { icon: MessageCircle, title: h.collectionChat, description: h.askAnything, href: '/collection-chat', badge: h.premium, gradient: 'from-green-600 to-green-800' },
    { icon: Brain, title: h.musicAnalysis, description: h.insights, href: '/ai-analysis', badge: h.newBadge, gradient: 'from-red-700 to-green-700' },
    { icon: TrendingUp, title: h.trends, description: h.discoverMoreShort, href: '/dashboard', badge: h.popular, gradient: 'from-green-700 to-red-600' },
    { icon: Store, title: h.openShop, description: h.sellVinyl, href: '/my-shop', badge: h.beta, gradient: 'from-red-600 to-green-600' },
  ];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{h.discoverSmartTools}</h2>
          <p className="text-muted-foreground">{h.smartToolsDesc}</p>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.title} to={feature.href} className="flex-shrink-0 w-48 snap-start">
                  <Card className="p-6 h-full hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden border-2 hover:border-red-500 dark:hover:border-red-400">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative z-10 space-y-3 text-center">
                      <div className="flex justify-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="font-bold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-4 md:hidden">
            <p className="text-xs text-muted-foreground">{h.swipeMore}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
